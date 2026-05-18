import { ArgumentError, StateError } from "@/error/common";
import { Dto, DtoField, FetchProp } from "./dto";
import { Entity } from "./entity";
import { dtoField } from "./dto_builder";
import { createRowReader, DtoRowReader } from "./row_reader";
import { makeErr } from "@/error/util";
import { EntityProp } from ".";
import { ReferenceFetchType } from "@/schema/dto";
import { EntityPropOrder } from "./entity_prop_order";

export function dtoMapper(dto: Dto, nullAsUndefined: boolean): DtoMapper {
    const mapper = new Mapper(
        dto.entity ?? makeErr(() => new ArgumentError(`"dto.entity" must be specified`)), 
        nullAsUndefined,
        undefined,
        undefined
    );
    for (const field of dto.fields) {
        mapper.add(field);
    }
    return mapper.toDtoMapper();
}

export class DtoMapper {

    private _rowReader: DtoRowReader | undefined = undefined;

    private _span: number | undefined = undefined;

    private _unresolvedFields: ReadonlyArray<DtoMapperField> | undefined = undefined;

    constructor(
        readonly entity: Entity,
        readonly nullAsUndefined: boolean,
        readonly associatedProp: FetchProp | undefined,
        readonly bridgeProp: EntityProp | undefined,
        readonly fields: ReadonlyArray<DtoMapperField>
    ) {}

    get rowReader(): DtoRowReader {
        let rowReader = this._rowReader;
        if (rowReader == null) {
            this._rowReader = rowReader = createRowReader(this);
        }
        return rowReader;
    }

    get span(): number {
        let span = this._span;
        if (span == null) {
            span = 0;
            for (const field of this.fields) {
                const index = field.columnIndex;
                if (typeof index != null) {
                    span++;
                }
            }
            this._span = span;
        }
        return span;
    }

    get unresolvedFields(): ReadonlyArray<DtoMapperField> {
        let unresolvedFields = this._unresolvedFields;
        if (unresolvedFields == null) {
            const arr: Array<DtoMapperField> = [];
            for (const field of this.fields) {
                if (field.dependencies != null) {
                    arr.push(field);
                }
            }
            this._unresolvedFields = unresolvedFields = arr;
        }
        return unresolvedFields;
    }
}

export type DtoMapperField = {

    readonly index: number;

    readonly prop: FetchProp;

    readonly parameter: any;

    readonly nullable: boolean;

    readonly bridgeProp: EntityProp | undefined;

    readonly paths: ReadonlyArray<Path>;

    readonly fetchType: ReferenceFetchType | undefined;

    readonly orders: ReadonlyArray<EntityPropOrder> | undefined;

    readonly subMapper: DtoMapper | undefined;

    readonly recursiveDepth: number | undefined;

    readonly dependencies: ReadonlyArray<number> | undefined;

    readonly isDependent: boolean;

    readonly columnIndex: number | string | undefined;
}

export type Path = string | ReadonlyArray<string>;

class Mapper {

    private fieldMap = new Map<string, MapperField>();

    private dependencyWriter: DepenencyWriter | undefined = undefined;

    private dependencyReader: DependencyReader | undefined = undefined;

    private columnIndex = 0;

    constructor(
        readonly entity: Entity,
        readonly nullAsUndefined: boolean,
        readonly associatedProp: FetchProp | undefined,
        readonly bridgeProp: EntityProp | undefined
    ) {}

    add(dtoField: DtoField) {
        this._add(dtoField, true);
    }
    
    private _add(dtoField: DtoField, mapPath: boolean) {
        
        let dependencies: ReadonlyArray<number> | undefined = undefined;

        this.dependencyWriter = { indices: [], parent: this.dependencyWriter };
        try {
            this._addImplicitFields(dtoField.prop);
        } finally {
            if (this.dependencyWriter.indices!.length !== 0) {
                dependencies = this.dependencyWriter.indices;
            }
            this.dependencyWriter = this.dependencyWriter.parent;
        }

        this.dependencyReader = { indices: dependencies, parent: this.dependencyReader };
        try {
            this._addImpl(dtoField, mapPath);
        } finally {
            this.dependencyReader = this.dependencyReader?.parent;
        }
    }

    private _addImplicitFields(prop: FetchProp) {
        if (prop.isEntityProp) {
            const entityProp = prop as EntityProp;
            if (entityProp.formulaData?.kind === "TS") {
                const view = entityProp.formulaData.formula.view();
                for (const field of view.mapper.fields) {
                    if (field.paths.length === 0) {
                        continue;
                    }
                    let dtoField = toDtoFields(field, false)[0]!;
                    if (field.paths.length === 0) {
                        this._add(dtoField, false);
                    } else {
                        for (const path of field.paths) {
                            const newPath = typeof path === "string"
                                ? [`<implicit:${prop.name}>`, path]
                                : [`<implicit:${prop.name}>`, ...path];
                            this._add({...dtoField, path: newPath}, true);
                        }
                    }
                }
                return;
            }
        }
        const referenceKeyProp = prop.referenceKeyProp;
        if (referenceKeyProp != null) {
            this._add(dtoField(referenceKeyProp), false);
        } else if (prop.targetEntity != null) {
            let keyProp = prop.thisKeyProp ?? prop.declaringEntity!.idProp;
            // TODO: backProp may not be id property
            this._add(dtoField(keyProp), false);
        }
    }

    private _addImpl(dtoField: DtoField, mapPath: boolean) {
        let field: MapperField | undefined = undefined;
        if (dtoField.dto == null || dtoField.prop.targetEntity != null) {
            field = this._field(dtoField);
            if (mapPath) {
                field.path(dtoField.path);
            }
            if (this.dependencyWriter != null) {
                this.dependencyWriter.indices.push(field.index);
                field.setDependent();
            }
        }
        if (dtoField.dto != null) {
            if (field != null) { // Association
                for (const subDtoField of dtoField.dto.fields) {
                    field.subMapper!._add(subDtoField, mapPath);
                }
            } else { // Embedded
                for (const subDtoField of dtoField.dto.fields) {
                    this._add({
                        ...subDtoField,
                        path: embeddedPath(dtoField.path, subDtoField.path)
                    }, mapPath);
                }
            }
        }
    }

    private _field(dtoField: DtoField) {
        const key = dtoFieldKey(dtoField);
        let field = this.fieldMap.get(key);
        if (field != null) {
            if (field.prop === dtoField.prop
            && field.bridgeProp != dtoField.bridgeProp) {
                throw new StateError(
                    `The property "${
                        (field.bridgeProp ?? field.prop).toString()
                    }" and "${
                        (dtoField.bridgeProp ?? field.prop).toString()
                    }" cannot be fetched together`
                );
            }
            return field;
        }
        field = new MapperField(
            this.nullAsUndefined,
            this.fieldMap.size, 
            () => this.columnIndex++,
            dtoField.prop, 
            dtoField.fetchType,
            dtoField.orders,
            dtoField.parameter,
            dtoField.nullable,
            dtoField.bridgeProp,
            dtoField.recursiveDepth,
            this.dependencyReader?.indices
        );
        this.fieldMap.set(key, field);
        return field;
    }

    toDtoMapper(): DtoMapper {
        const fields = Array.from(this.fieldMap.values()).map(f => f.toDtoMapperField());
        this._handleRecursiveFields(fields);
        return new DtoMapper(
            this.entity,
            this.nullAsUndefined,
            this.associatedProp,
            this.bridgeProp,
            fields
        );
    }

    private _handleRecursiveFields(
        fields: Array<DtoMapperField>
    ) {
        for (let i = 0; i < fields.length; i++) {
            const field = fields[i]!;
            if (field.recursiveDepth == null) {
                continue;
            }
            fields[i] = {
                ...field,
                subMapper: this._makeRecursiveSubMapper(field, fields)
            }
        }
    }

    private _makeRecursiveSubMapper(
        recursiveField: DtoMapperField,
        fields: ReadonlyArray<DtoMapperField>
    ): DtoMapper {
        const usedArr: boolean[] = new Array(fields.length).fill(false);
        for (let i = 0; i < fields.length; i++) {
            const field = fields[i]!;
            if (field === recursiveField) {
                Mapper.useField(i, fields, usedArr);
            } else if (field.recursiveDepth == null && field.paths.length != 0) {
                Mapper.useField(i, fields, usedArr);
            }
        }
        const newFields: Array<DtoMapperField> = [];
        let indexDelta = 0;
        let columnIndexDelta = 0;
        for (let i = 0; i < fields.length; i++) {
            const field = fields[i]!;
            if (!usedArr[i]) {
                indexDelta--;
                if (field.columnIndex != null) {
                    columnIndexDelta--;
                }
                continue;
            }
            const newField: DtoMapperField = {
                ...field,
                recursiveDepth: undefined,
                columnIndex: typeof field.columnIndex === "number" 
                    ? field.columnIndex + columnIndexDelta 
                    : undefined,
                dependencies: field.dependencies?.map(i => i + indexDelta)
            };
            newFields.push(newField);
        }
        return new DtoMapper(
            this.entity,
            this.nullAsUndefined,
            recursiveField.prop,
            recursiveField.bridgeProp,
            newFields
        );
    }

    private static useField(
        index: number, 
        fields: ReadonlyArray<DtoMapperField>, 
        usedArr: Array<boolean>
    ) {
        if (usedArr[index]) {
            return true;
        }
        usedArr[index] = true;
        const dependencies = fields[index]!.dependencies;
        if (dependencies != null) {
            for (const dependency of dependencies) {
                Mapper.useField(dependency, fields, usedArr)
            }
        }
    }
};

class MapperField {

    readonly subMapper : Mapper | undefined;

    private paths = new Set<string>();

    private isDependent = false;

    constructor(
        nullAsUndefined: boolean,
        readonly index: number,
        readonly columnIndexAllocator: () => number,
        readonly prop: FetchProp,
        readonly fetchType: ReferenceFetchType | undefined,
        readonly orders: ReadonlyArray<EntityPropOrder> | undefined,
        readonly parameter: any,
        readonly nullable: boolean,
        readonly bridgeProp: EntityProp | undefined,
        readonly recursiveDepth: number | undefined,
        readonly dependencies: ReadonlyArray<number> | undefined
    ) {
        if (prop.targetEntity == null || recursiveDepth != null) {
            this.subMapper = undefined;
        } else {
            this.subMapper = new Mapper(prop.targetEntity, nullAsUndefined, prop, bridgeProp);
        }
    }

    path(path: string | ReadonlyArray<string> | undefined) {
        if (path != null) {
            const str = typeof path === "string"
                ? path
                : path.join("/");
            this.paths.add(str);
        }
    }

    setDependent() {
        this.isDependent = true;
    }

    toDtoMapperField(): DtoMapperField {
        const paths = Array.from(this.paths).map(path => {
            const parts = path.split('/');
            return parts.length === 1
                ? parts[0]!
                : parts;
        });
        return {
            index: this.index,
            prop: this.prop,
            parameter: this.parameter,
            bridgeProp: this.bridgeProp,
            nullable: this.nullable,
            paths,
            subMapper: this.subMapper?.toDtoMapper(),
            fetchType: this.fetchType,
            orders: this.orders,
            recursiveDepth: this.recursiveDepth,
            dependencies: this.dependencies,
            isDependent: this.isDependent,
            columnIndex: this.dependencies !== undefined
                ? undefined
                : this.columnIndexAllocator()
        };
    }
}

function dtoFieldKey(field: DtoField): string {
    let key = field.prop.toString();
    if (field.orders != null) {
        key += `\x1Fo:${JSON.stringify(field.orders)}`;
    }
    if (field.parameter != null) {
        key += `\x1Fp:${JSON.stringify(field.parameter)}`;
    }
    return key;
}

function embeddedPath(
    path1: string | ReadonlyArray<string> | undefined,
    path2: string | ReadonlyArray<string> | undefined
): ReadonlyArray<string> | undefined {
    if (path1 == null || path2 == null) {
        return undefined;
    }
    const arr1 = typeof path1 === "string" ? [path1] : path1;
    const arr2 = typeof path2 === "string" ? [path2] : path2;
    return [...arr1, ...arr2];
}

type DepenencyWriter = {
    indices: Array<number>;
    parent: DepenencyWriter | undefined;
}

type DependencyReader = {
    indices: ReadonlyArray<number> | undefined;
    parent: DependencyReader | undefined;
}

function toDto(
    mapper: DtoMapper
): Dto {
    const dtoFields: Array<DtoField> = [];
    for (const field of mapper.fields) {
        dtoFields.push(...toDtoFields(field, true));
    }
    return {
        entity: mapper.entity,
        fields: dtoFields
    };
}

function toDtoFields(
    field: DtoMapperField,
    assignPath: boolean
): ReadonlyArray<DtoField> {
    const dtoField: DtoField = {
        path: undefined,
        prop: field.prop,
        bridgeProp: field.bridgeProp,
        dto: field.subMapper != null ? toDto(field.subMapper) : undefined,
        fetchType: field.fetchType,
        orders: field.orders,
        recursiveDepth: field.recursiveDepth,
        nullable: field.nullable,
        parameter: field.parameter
    };
    if (field.paths.length === 0 || !assignPath) {
        return [dtoField];
    }
    return field.paths.map(path => {
        return { ...dtoField, path };
    });
}

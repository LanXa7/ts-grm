import { ArgumentError, StateError } from "@/error/common";
import { Dto, DtoField, FetchProp, TypeNameProp } from "./dto";
import { Entity } from "./entity";
import { dtoField } from "./dto_builder";
import { createDtoRowReader, DtoRowReader } from "./row_reader";
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

    private _dtoRowReader: DtoRowReader | undefined = undefined;

    private _span: number | undefined = undefined;

    private _unresolvedFields: ReadonlyArray<DtoMapperField> | undefined = undefined;

    private _downcastEntities: ReadonlyArray<Entity> | undefined = undefined;

    private _typeNameIndex: number | undefined = undefined;

    constructor(
        readonly entity: Entity,
        readonly nullAsUndefined: boolean,
        readonly associatedProp: FetchProp | undefined,
        readonly bridgeProp: EntityProp | undefined,
        readonly fields: ReadonlyArray<DtoMapperField>
    ) {}

    get dtoRowReader(): DtoRowReader {
        let rowReader = this._dtoRowReader;
        if (rowReader == null) {
            this._dtoRowReader = rowReader = createDtoRowReader(this);
        }
        return rowReader;
    }

    get span(): number {
        let span = this._span;
        if (span == null) {
            span = 0;
            for (const field of this.fields) {
                const index = field.columnIndex;
                if (index != null) {
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

    get downcastEntities(): ReadonlyArray<Entity> | undefined {
        let downcastEntities = this._downcastEntities;
        if (downcastEntities == null) {
            const set = new Set<Entity>();
            for (const field of this.fields) {
                if (field.downcastTo != null) {
                    set.add(field.downcastTo);
                }
            }
            this._downcastEntities = downcastEntities = 
                set.size === 0
                    ? []
                    : [this.entity, ...Array.from(set)];
        }
        return downcastEntities.length === 0 ? undefined : downcastEntities;
    }

    get typeNameIndex(): number {
        let index = this._typeNameIndex;
        if (index == null) {
            this._typeNameIndex = index = 
                this.fields.findIndex(f => f.prop instanceof TypeNameProp);
        }
        return index;
    }
}

export type DtoMapperField = {

    readonly index: number;

    readonly downcastTo: Entity | undefined;

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

    readonly optimizable: boolean;
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
            this._addImplicitFields(dtoField);
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

    private _addImplicitFields(field: DtoField) {
        const prop = field.prop;
        if (prop.isEntityProp) {
            const entityProp = prop as EntityProp;
            if (entityProp.tsFormulaDependencyView != null) {
                const view = entityProp.tsFormulaDependencyView;
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
            this._add(dtoField(field.downcastTo, referenceKeyProp), false);
        } else if (prop.targetEntity != null) {
            let keyProp = prop.thisKeyProp ?? prop.declaringEntity!.idProp;
            this._add(dtoField(field.downcastTo, keyProp), false);
        }
    }

    private _addImpl(dtoField: DtoField, mapPath: boolean) {
        if (dtoField.downcastTo != null) {
            this._addTypeNameField();
        }
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

    private _addTypeNameField() {
        for (const field of this.fieldMap.values()) {
            if (field.prop instanceof TypeNameProp) {
                return;
            }
        }
        const field: DtoField = {
            path: "__typename",
            downcastTo: undefined,
            prop: new TypeNameProp(
                this.entity,
                this.entity.tableSettings.discriminator?.name,
                this.entity.tableSettings.discriminator == null ? this.entity.name : undefined
            ),
            bridgeProp: undefined,
            dto: undefined,
            fetchType: undefined,
            orders: undefined,
            recursiveDepth: undefined,
            nullable: false,
            parameter: undefined
        };
        this._add(field, true);
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
            dtoField.downcastTo,
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
        let dependencyDeltaMap = new Map<number, number>();
        for (let i = 0; i < fields.length; i++) {
            const field = fields[i]!;
            if (!usedArr[i]) {
                indexDelta--;
                if (typeof field.columnIndex === "number") {
                    columnIndexDelta--;
                }
                for (let next = i + 1; next < fields.length; next++) {
                    const delta = dependencyDeltaMap.get(next) ?? 0;
                    dependencyDeltaMap.set(next, delta - 1);
                }
                continue;
            }
            const newField: DtoMapperField = {
                ...field,
                recursiveDepth: undefined,
                index: field.index + indexDelta,
                columnIndex: typeof field.columnIndex === "number" 
                    ? field.columnIndex + columnIndexDelta 
                    : undefined,
                dependencies: field.dependencies?.map(i => i + (dependencyDeltaMap.get(i) ?? 0))
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

    lessThan(props: ReadonlyArray<EntityProp>): boolean {
        for (const field of this.fieldMap.values()) {
            if (!field.prop.isEntityProp) {
                return false;
            }
            const fieldPropPath = (field.prop as EntityProp).path;
            let matched = false;
            for (const prop of props) {
                const scalarProps = prop.scalarProps;
                if (scalarProps == null) {
                    throw new ArgumentError(`The argument contains "${prop.toString()}" which is not scalar props`);
                }
                if (scalarProps.findIndex(p => p.path === fieldPropPath) !== -1) {
                    matched = true;
                    break;
                }
            }
            if (!matched) {
                return false;
            }
        }
        return true;
    }
};

class MapperField {

    readonly subMapper : Mapper | undefined;

    private paths = new Set<string>();

    private isDependent = false;

    constructor(
        nullAsUndefined: boolean,
        readonly downcastTo: Entity | undefined,
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
            downcastTo: this.downcastTo,
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
            columnIndex: this._hasColumn()
                ? this.columnIndexAllocator()
                : undefined,
            optimizable: this.isOptimizable()
        };
    }

    private isOptimizable(): boolean {
        if (this.subMapper == null) {
            return false;
        }
        if (this.bridgeProp != null) {
            const targetKeyProp = this.bridgeProp.targetKeyProp ?? this.bridgeProp.targetEntity!.idProp;
            return this.subMapper.lessThan(targetKeyProp.scalarProps!);
        }
        if (!this.prop.isEntityProp) {
            return false;
        }
        const entityProp = this.prop as EntityProp;
        if (entityProp.associationType === null) {
            return false;
        }
        if (entityProp.storageType === "NONE") {
            return false;
        }
        const targetKeyProp = entityProp.targetKeyProp ?? entityProp.targetEntity!.idProp;
        return this.subMapper.lessThan(targetKeyProp.scalarProps!);
    }

    private _hasColumn(): boolean {
        if (this.dependencies != null) {
            return false;
        }
        if (this.prop instanceof TypeNameProp) {
            const typedNameProp = this.prop as TypeNameProp;
            return typedNameProp.columName != null;
        }
        return true;
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
        downcastTo: field.downcastTo,
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

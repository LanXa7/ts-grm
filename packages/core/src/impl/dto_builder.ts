import { ArgumentError, StateError } from "@/error/common";
import { Entity } from "./entity";
import { EntityProp } from "./entity_prop";
import { Dto, DtoField, InverseFetchProp } from "./dto";
import { capitalize } from "./util";
import { makeErr } from "@/error/util";

export function createTypedDtoBuilder(entity: Entity): TypedDtoBuilder {
    const builder = new DtoBuilder(entity);
    return new Proxy(builder, typedDtoBuilderHandler) as any as TypedDtoBuilder;
}

interface TypedDtoBuilder {
    __unwrap(): DtoBuilder
}

type TypedDtoBuilderFn = (builder: TypedDtoBuilder) => TypedDtoBuilder;

class DtoBuilder {

    private readonly fields: Array<DtoField> = [];

    private lastPropName: string | undefined = undefined;

    constructor(
        private readonly source: Entity | EntityProp
    ) {}

    prop(name: string): EntityProp {
        if (this.source instanceof Entity) {
            return this.source.allPropMap.get(name) ?? makeErr(() => 
                new ArgumentError(`No property "${name}" in model "${this.source.name}"`)
            );
        }
        return this.source.props?.get(name) ?? makeErr(() =>
            new ArgumentError(`No property "${name}" in embeded path "${this.source.toString()}"`)
        );
    }

    add(prop: EntityProp, fn?: TypedDtoBuilderFn, parameter?: any) {
        const field = dtoField(prop, fn, parameter);
        this.fields.push(field);
        this.lastPropName = prop.name;
    }

    flat(prefix: string, prop: EntityProp, fn?: TypedDtoBuilderFn) {
        if (prop.props == null 
            && prop.associationType !== "ONE_TO_ONE" 
            && prop.associationType !== "MANY_TO_ONE"
        ) {
            throw new ArgumentError(`Cannot flat the property "${prop.toString()}" 
            because it is neither reference nor embedded property`);
        }
        const field: DtoField = dtoField(prop, fn);
        if (prop.targetEntity != null) {
            const convertedField: DtoField = {
                ...field,
                path: undefined,
                dto: flattenDto(field.dto, prefix, 0)
            };
            this.fields.push(convertedField);
        } else {
            for (const nestedField of field.dto!.fields) {
                const convertedNestedField = {
                    ...nestedField,
                    path: nestedField.path != null 
                        ? withPrefix(prefix, nestedField.path)
                        : undefined
                }
                this.fields.push(convertedNestedField);
            }
        }
        this.lastPropName = undefined;
    }

    fold(key: string, fn: TypedDtoBuilderFn) {
        if (key === "") {
            throw new ArgumentError(`The key of "fold" function cannot be empty`);
        }
        const builder = new Proxy(
            new DtoBuilder(this.source),
            typedDtoBuilderHandler
        ) as any as TypedDtoBuilder;
        fn(builder);
        const dto = builder.__unwrap().build();
        const foldFields = dto.fields.map(f => {
            return {
                ...f,
                path: f.path != null 
                    ? withFoldKey(key, f.path)
                    : undefined
            };
        });
        for (const foldField of foldFields) {
            this.fields.push(foldField);
        }
        this.lastPropName = undefined;
    }

    allScalars() {
        const propMap = this.source instanceof Entity
            ? this.source.allPropMap
            : this.source.props ?? makeErr("Internal bug");
        for (const prop of propMap.values()) {
            if (prop.referenceProp == null && (prop.scalarType != null || prop.props != null)) {
                this.add(prop);
            }
        }
        this.lastPropName = undefined;
    }

    remove(...aliases: string[]) {
        for (const alias of aliases) {
            const arr = this.fields;
            for (let i = arr.length - 1; i >= 0; --i) {
                if (isMatched(arr[i]!, alias)) {
                    arr.splice(i, 1);
                }
            }
        }
        this.lastPropName = undefined;
    }

    recursive(options: RecursiveOptions) {
        const propName = typeof options === "string"
            ? options
            : options.prop;
        const prop = this.prop(propName);
        const alias = typeof options === "string" 
            ? propName
            : options.alias ?? propName;
        const depth = typeof options === "string"
            ? -1
            : options.depth ?? -1;
        if (depth !== -1 && depth < 1) {
            throw new ArgumentError(`The recursive depth must be at least 1`);
        }
        if (!prop.isRecursive) {
            throw new ArgumentError(`The property ${prop.toString()} is not recursive`);
        }
        for (const field of this.fields) {
            if (field.prop === prop) {
                throw new StateError(
                    `Cannot fetch the property ${prop.toString()} recursively 
                    because annother dto field fetches the association unrecursively`
                );
            }
        }
        const field: DtoField = {
            path: alias,
            prop: prop,
            bridgeProp: undefined,
            dto: undefined,
            fetchType: undefined,
            orders: undefined,
            recursiveDepth: depth,
            nullable: prop.nullable,
            dependency: undefined,
            parameter: undefined
        };
        this.fields.push(field);
    }

    $as(alias: string) {
        if (this.lastPropName == null) {
            throw new StateError(`"$as" function cannot be invoked because there is no last property`);
        }
        if (alias === "") {
            throw new ArgumentError(`The arugment of "$as" function cannot be empty`);
        }
        const arr = this.fields;
        const renamedFields: Array<DtoField> = [];
        for (let i = arr.length - 1; i >= 0; --i) {
            if (!isMatched(arr[i]!, this.lastPropName)) {
                continue;
            }
            const field = arr.splice(i, 1)[0]!;
            renamedFields.unshift(rename(field, alias));
        }
        for (const renamedField of renamedFields) {
            this.fields.push(renamedField);
        }
        this.lastPropName = alias;
    }

    build(): Dto {
        const absPaths = new Set<string>();
        for (const field of this.fields) {
            const path = field.path;
            if (path == null) {
                continue;
            }
            const absPath = typeof path === "string" ? path : path.join(".");
            if (absPaths.has(absPath)) {
                throw new ArgumentError(`Duplicated DTO path "${absPath}"`);
            }
            absPaths.add(absPath);
        }
        return {
            entity: this.source instanceof Entity
                ? this.source
                : undefined,
            fields: this.fields
        };
    }
}

const typedDtoBuilderHandler: ProxyHandler<DtoBuilder> = {
    get: (target: DtoBuilder, prop: string | symbol, receiver: any) => {
        if (typeof prop === 'symbol') {
            return Reflect.get(target, prop);
        }
        switch (prop) {
            case "__unwrap":
                return () => {
                    return target;
                };
            case "allScalars":
                return () => {
                    target.allScalars();
                    return receiver;
                }
            case "flat":
                return (options: FlatOptions, fn?: TypedDtoBuilderFn) => {
                    const prop = typeof options === "string"
                        ? options 
                        : options.prop;
                    const prefix = typeof options === "string"
                        ? prop
                        : options.prefix ?? prop;
                    target.flat(prefix, target.prop(prop), fn);
                    return receiver;
                }
            case "fold":
                return (key: string, fn: TypedDtoBuilderFn) => {
                    target.fold(key, fn);
                    return receiver;
                }
            case "remove":
                return (...aliases: string[]) => {
                    target.remove(...aliases);
                    return receiver;
                }
            case "recursive":
                return (options: RecursiveOptions) => {
                    target.recursive(options);
                    return receiver;
                }
            case "$as":
                return (alias: string) => {
                    target.$as(alias);
                    return receiver;
                }
            default:
                if (prop in target) {
                    return Reflect.get(target, prop);
                }
                const entityProp = target.prop(prop);
                if (entityProp.props != null || entityProp.targetEntity != null) {
                    if (entityProp.calculatorData?.parameterType != null) {
                        return (parameter: any, fn?: TypedDtoBuilderFn) => {
                            target.add(entityProp, fn, parameter);
                            return receiver;
                        }    
                    }
                    return (fn?: TypedDtoBuilderFn) => {
                        target.add(entityProp, fn);
                        return receiver;
                    }
                }
                if (entityProp.parameterType != null) {
                    return (parameter: any) => {
                        target.add(entityProp, undefined, parameter);
                        return receiver;
                    }
                }
                target.add(entityProp);
                return receiver;
        }
    }
};

export function dtoField(
    prop: EntityProp, 
    fn?: TypedDtoBuilderFn,
    parameter?: any
): DtoField {
    if (prop.storageType === "MIDDLE_ENTITY") {
        const middleEntity = prop.middleEntity!;
        const middleBuilder = createTypedDtoBuilder(middleEntity.entity);
        (middleBuilder as any).flat({
            prop: middleEntity.joinTargetProp.name,
            prefix: ""
        }, fn);
        const middleDto = middleBuilder.__unwrap().build();
        return {
            path: prop.name,
            prop: InverseFetchProp.of(middleEntity.joinThisProp),
            bridgeProp: prop,
            dto: middleDto,
            fetchType: undefined,
            orders: undefined,
            recursiveDepth: undefined,
            nullable: prop.nullable,
            dependency: undefined,
            parameter: undefined
        };
    }
    if (prop.targetEntity != null) {
        const childBuilder = createTypedDtoBuilder(prop.targetEntity);
        (fn ?? ($ => ($ as any).allScalars()))(childBuilder);
        const childDto = childBuilder.__unwrap().build();
        return {
            path: prop.name,
            prop: prop,
            bridgeProp: undefined,
            dto: childDto,
            fetchType: undefined,
            orders: undefined,
            recursiveDepth: undefined,
            nullable: prop.nullable,
            dependency: undefined,
            parameter
        };
    }
    if (prop.props != null) {
        const childBuilder = new Proxy(
            new DtoBuilder(prop),
            typedDtoBuilderHandler
        ) as any as TypedDtoBuilder;
        (fn ?? ($ => ($ as any).allScalars()))(childBuilder);
        const childDto = childBuilder.__unwrap().build();
        return {
            path: prop.name,
            prop: prop,
            bridgeProp: undefined,
            dto: childDto,
            fetchType: undefined,
            orders: undefined,
            recursiveDepth: undefined,
            nullable: prop.nullable,
            dependency: undefined,
            parameter: undefined
        };
    }
    if (fn != null) {
        throw new ArgumentError(
            `Child DTO cannnot be specified for "${prop.toString()}" 
            which is neither associated nor embeded property`
        );
    }
    return {
        path: prop.name,
        prop: prop,
        bridgeProp: undefined,
        dto: undefined,
        fetchType: undefined,
        orders: undefined,
        recursiveDepth: undefined,
        nullable: false,
        dependency: undefined,
        parameter
    };
}

type FlatOptions = string | { 
    readonly prop: string;
    readonly prefix?: string
};

function withPrefix(
    prefix: string, 
    path: string | ReadonlyArray<string>
): string | ReadonlyArray<string> {
    if (prefix === "") {
        return path;
    }
    if (typeof path === "string") {
        return `${prefix}${capitalize(path)}`;
    }
    return [`${prefix}${capitalize(path[0]!)}`, ...path.slice(1, path.length)];
}

function withFoldKey(
    key: string, 
    path: string | ReadonlyArray<string>
): ReadonlyArray<string> {
    if (typeof path === "string") {
        return [key, path];
    }
    return [key, ...path];
}

function isMatched(
    field: DtoField, 
    alias: string
): boolean {
    const path = field.path;
    if (path == null) {
        return false;
    }
    if (typeof path === "string") {
        return path === alias;
    }
    return path[0] === alias;
}

function rename(
    field: DtoField, 
    alias: string
): DtoField {
    const path = field.path;
    if (path == null) {
        return field;
    }
    const newPath = typeof path === "string"
        ? alias
        : [alias, ...path.slice(1, path.length)];
    return {
        ...field,
        path: newPath
    };
}

function flattenDto(
    dto: Dto | undefined, 
    prefix: string,
    depth: number
): Dto | undefined {
    if (dto == null) {
        return undefined
    }
    return {
        ...dto,
        fields: dto.fields.map(field => {
            return {
                ...field,
                path: flattenPath(field.path, prefix, depth),
                dto: field.dto != null && (
                    field.prop.associationType === "MANY_TO_ONE" 
                        || field.prop.associationType === "ONE_TO_MANY"
                    )
                    ? flattenDto(field.dto, prefix, depth + 1)
                    : field.dto
            };
        })
    };
}

function flattenPath(
    path: string | ReadonlyArray<string> | undefined,
    prefix: string,
    depth: number
): string | ReadonlyArray<string> | undefined {
    if (path == null) {
        return undefined;
    }
    const arr = typeof path === "string" ? [path] : path;
    if (arr.length < depth) {
        return path;
    }
    let matchedCount = 0;
    for (let i = 0; i < depth; i++) {
        if (arr[i] !== "..") {
            break;
        }
        matchedCount++;
    }
    if (matchedCount !== depth) {
        return path;
    }
    const finalPath = ["..", ...arr];
    finalPath[matchedCount + 1] = 
        prefix === "" 
            ? finalPath[matchedCount + 1]!
            : `${prefix}${capitalize(finalPath[matchedCount + 1]!)}`;
    return finalPath;
}

type RecursiveOptions = string | {
    readonly prop: string,
    readonly alias?: string | null | undefined,
    readonly depth?: number | null | undefined
};
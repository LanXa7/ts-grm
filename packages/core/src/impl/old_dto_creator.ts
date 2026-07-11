import { ViewArgsImpl } from "@/schema/view";
import { Dto, DtoField } from "./dto";
import { Entity } from "./entity";
import { AllScalarsArgs } from "@/schema/view/all_scalars";
import { Flat } from "@/schema/view/flat";
import { ArgumentError, StateError } from "@/error/common";
import { EntityProp } from "./entity_prop";
import { makeErr } from "@/error/util";
import { With } from "@/schema/view/common";
import { Fold } from "@/schema/view/fold";
import { capitalize } from "./util";

export class DtoCreator {

    private readonly _fields: Array<DtoField>;

    private readonly _contextPaths: ReadonlyArray<string>;

    private constructor(
        private readonly _source: Entity | EntityProp,
        private readonly _downcastTo: Entity | undefined,
        options: {
            readonly parent: DtoCreator;
            readonly contextPath: string;
        } | undefined
    ) {
        if (options != null) {
            this._contextPaths = [...options.parent._contextPaths, options.contextPath];
            this._fields = options.parent._fields;
        } else {
            this._contextPaths = [];
            this._fields = [];
        }
    }

    static of(
        source: Entity | EntityProp, 
        downcastTo: Entity | undefined
    ): DtoCreator {
        return new DtoCreator(source, downcastTo, undefined);
    }

    create(
        viewArgs: ViewArgsImpl<any, any, any>
    ): Dto {
        this._process(viewArgs);
        return {
            entity: this._source as Entity,
            fields: this._fields
        }
    }
    
    private _process(
        viewArgs: ViewArgsImpl<any, any, any>
    ): void {

        for (const key in viewArgs) {
            switch (key) {
                case "$allScalars":
                    this._addAllScalarsFields(viewArgs[key] as AllScalarsArgs<any>);
                    break;
                case "$flat":
                    this._addFlatFields(viewArgs[key] as Flat<any, any, any>);
                    break;
                case "$fold":
                    this._addFoldFields(viewArgs[key] as Fold<any, any, any, any>);
                    break;
                case "$polymorphism":
                    break;
                case "$associatedKeys":
                    break;
                case "$recursive":
                    break;
                default: 
                    this._addField(key, viewArgs[key]);
                    break;
            }
        }
    }

    private _sub(path: string): DtoCreator {
        return new DtoCreator(
            this._source, 
            this._downcastTo, 
            { parent: this, contextPath: path }
        );
    }

    private _addAllScalarsFields(
        args: AllScalarsArgs<any>
    ) {
        const excludedArr = typeof args === "boolean"
            ? undefined
            : typeof args.exclude === "string"
                ? [args.exclude]
                : args.exclude;
        const propMap = this._source instanceof Entity
            ? this._source.allPropMap
            : this._source.props ?? makeErr("Internal bug: cannot get allScalars");
        for (const prop of propMap.values()) {
            if (prop.referenceProp != null) {
                continue;
            }
            if (prop.scalarType == null && prop.props == null) {
                continue;
            }
            if (excludedArr != null && excludedArr.indexOf(prop.name) !== -1) {
                continue;
            }
            this._fields.push(this._createField(prop, true));
        }
    }

    private _addFlatFields(
        flat: Flat<any, any, any>
    ) {
        if (this._downcastTo != null) {
            throw new StateError(`"$flat" cannot be used in "$polymorphism"`);
        }
        const flatArgs = flat(argsContext);
        for (const key in flatArgs) {
            const prop = this._prop(key);
            const args = flatArgs[key];
            const childDto = this._createDto(
                DtoCreator.of(prop.associationType != null ? prop.targetEntity! : prop, undefined),
                args
            );
            console.log(`childDto`, JSON.stringify(childDto))
            const prefix = args.prefix ?? prop.name;
            const flattenFields = 
                childDto.fields.map(field => {
                    return {
                        ...field,
                        path: flattenPath(prop.props != null, prefix, field.path)
                    };
                });
            if (prop.props != null) {
                this._fields.push(...flattenFields);
                return;
            }
            const flattenDto = {
                ...childDto,
                fields: flattenFields
            };
            const field: DtoField = {
                path: undefined,
                downcastTo: undefined,
                prop: prop,
                bridgeProp: undefined,
                dto: flattenDto,
                fetchType: args.fetchType,
                predicateFn: args.where,
                orders: prop.orders,
                limit: undefined,
                recursiveDepth: undefined,
                nullable: prop.nullable,
                parameter: undefined
            };
            this._fields.push(field);
        }
    }

    private _addFoldFields(
        fold: Fold<any, any, any, any>
    ) {
        for (const key in fold) {
            const foldItemArgs = fold[key]!;
            const args = foldItemArgs(argsContext);
            this._sub(key)._process(args as ViewArgsImpl<any, any, any>);
        }
    }

    private _prop(key: string) {
        if (this._source instanceof EntityProp) {
            const prop = this._source.props!.get(key)?.asEntityProp;
            if (prop == null) {
                throw new ArgumentError(`No property "${key}" of the embeded property "${this._source.toString()}"`);
            }
            return prop;
        }

        const entity = this._source as Entity;
        const prop = entity.allPropMap.get(key)?.asEntityProp;
        if (prop == null) {
            throw new ArgumentError(`No property "${key}" of the entity "${entity.name}"`);
        }
        return prop;
    }

    private _addField(
        key: string,
        args: any
    ) {
        this._fields.push(this._createField(this._prop(key), args));
    }

    private _createField(
        prop: EntityProp, 
        args: any,
    ): DtoField {
        if (prop.targetEntity != null) {
            return {
                path: this._path(prop, args),
                downcastTo: this._downcastTo,
                prop: prop,
                bridgeProp: undefined,
                dto: this._createDto(DtoCreator.of(prop.targetEntity!, undefined), args),
                fetchType: args.fetchType,
                predicateFn: args.where,
                orders: prop.orders,
                limit: args.limit,
                recursiveDepth: undefined,
                nullable: prop.nullable,
                parameter: undefined
            };
        }
        if (prop.props != null) {
            return {
                path: this._path(prop, args),
                downcastTo: this._downcastTo,
                prop: prop,
                bridgeProp: undefined,
                dto: this._createDto(DtoCreator.of(prop, this._downcastTo), args),
                fetchType: undefined,
                predicateFn: undefined,
                orders: prop.orders,
                limit: undefined,
                recursiveDepth: undefined,
                nullable: prop.nullable,
                parameter: undefined
            };
        }
        return {
            path: this._path(prop, args),
            downcastTo: this._downcastTo,
            prop,
            bridgeProp: undefined,
            dto: undefined,
            fetchType: undefined,
            predicateFn: undefined,
            orders: [],
            limit: undefined,
            recursiveDepth: undefined,
            nullable: prop.nullable,
            parameter: undefined
        };
    }

    private _path(
        prop: EntityProp, 
        args: any
    ): string | ReadonlyArray<string> {
        let name = args.alias ?? prop.name;
        let arr = [name];
        if (this._source instanceof EntityProp) {
            const subPath = this._source.subPath;
            if (subPath !== "") {
                arr = [...subPath.split("."), ...arr];
            }
        }
        if (this._contextPaths.length !== 0) {
            arr = [...this._contextPaths, ...arr];
        }
        return arr.length === 1 ? arr[0]! : arr;
    }

    private _createDto(
        childDtoCreator: DtoCreator,
        args: any
    ): Dto {
        let _with: With<any, any, any, any> | undefined = undefined;
        if (typeof args === "function") {
            _with = args;
        } else if (typeof args === "object") {
            _with = args.with;  
        }
        if (_with == null) {
            return childDtoCreator.create({
                $allScalars: true
            });
        }
        return childDtoCreator.create(_with(argsContext));
    }
}

function argsContext(args: any): any {
    return args;
}

function flattenPath(
    isEmbedded: boolean,
    prefix: string,
    path: string | ReadonlyArray<string> | undefined
): ReadonlyArray<string> | undefined {
    if (path == null) {
        return undefined;
    }
    const arr = typeof path === "string"
        ? [path]
        : [...path];
    if (prefix !== "") {
        arr[0] = `${prefix}${capitalize(arr[0]!)}`;
    }
    if (isEmbedded) {
        return arr;
    }
    return ["..", ...arr];
}
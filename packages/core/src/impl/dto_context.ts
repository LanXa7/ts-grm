import { Entity } from "./entity";
import { EntityProp } from "./entity_prop";
import { ArgumentError, StateError } from "@/error/common";
import { AbstractEntityTable } from "./entity_table";
import { Predicate } from "@/dsl";
import { ReferenceFetchType } from "@/schema/dto/reference_fetch_type";
import { CodeWriter } from "./code_writer";
import { StandardSchemaV1 } from "@standard-schema/spec";
import { OrderNullsType } from "@/schema/order";
import { Dto, DtoField, FetchProp, InverseFetchProp, TypeNameProp } from "./dto";
import { EntityPropOrder, toEntityPropOrders } from "./entity_prop_order";
import { capitalize } from "./util";
import { Path } from "./dto_mapper";
import { AnyModel } from "@/internal_types";

export interface AbstractDtoMapping {

    readonly __mappingType: string;

    toFields(
        downcastTo: Entity | undefined
    ): DtoField | ReadonlyArray<DtoField>;
}

type DtoBody = (ctx: AbstractDtoContext) => ReadonlyArray<AbstractDtoMapping>;

type Filter = (table: AbstractEntityTable) => Predicate | undefined;

class AllScalarsMapping implements AbstractDtoMapping {

    readonly __mappingType = 'ALL_SCALARS';

    private _props: ReadonlyArray<EntityProp> | undefined = undefined;

    constructor(
        private readonly _context: AbstractDtoContext,
        private readonly _excludedKeys: ReadonlyArray<string> | undefined
    ) {
        if (_context.declaredOnly) {
            throw new StateError(`"$allScalars" cannot be used in the scope of "$instanceOf"`);
        }
    }

    get props(): ReadonlyArray<EntityProp> {
        let props = this._props;
        if (props == null) {
            const allProps = Array.from(
                this._context!.embeddedProp?.props?.values() 
                    ?? this._context!.entity.allPropMap.values()
            );
            const ex = ExcludingContext.of(this._excludedKeys);
            this._props = props = allProps.filter(p => 
                p.referenceProp == null 
                && (p.scalarType != null || p.props != null) 
                && (ex == null || !ex.isMatched(p))
            );
        }
        return props;
    }

    exclude(
        ...keys: ReadonlyArray<string>
    ): AllScalarsMapping {
        return new AllScalarsMapping(this._context, keys);
    }

    toFields(
        downcastTo: Entity | undefined
    ): ReadonlyArray<DtoField> {
        const fields: Array<DtoField> = [];
        for (const prop of this.props) {
            fields.push(this._toField(prop, downcastTo));
        }
        return fields;
    }

    private _toField(
        prop: EntityProp,
        downcastTo: Entity | undefined
    ): DtoField {
        return {
            path: prop.name,
            downcastTo,
            prop,
            bridgeProp: undefined,
            dto: this._toDto(prop),
            fetchType: undefined,
            predicateFn: undefined,
            orders: undefined,
            limit: undefined,
            recursiveDepth: undefined,
            nullable: prop.nullable,
            parameter: undefined
        };
    }

    private _toDto(prop: EntityProp): Dto | undefined {
        if (prop.props == null) {
            return undefined;
        }
        const fields = Array.from(prop.props.values()).map(p => this._toField(p, undefined));
        return {
            entity: this._context.entity,
            fields
        }
    }
}

class ExcludingContext {

    private readonly _key: string | undefined

    private readonly _keys: Set<string> | undefined;

    private constructor(keys: string | ReadonlyArray<string>) {
        if (typeof keys === "string") {
            this._key = keys;
        } else if (keys.length == 1) {
            this._key = keys[0]!;
        } else {
            this._keys = new Set<string>(keys);
        }
    }

    static of(
        keys: string | ReadonlyArray<string> | undefined
    ): ExcludingContext | undefined {
        if (keys == null) {
            return undefined;
        }
        if (Array.isArray(keys) && keys.length === 0) {
            return undefined;
        }
        return new ExcludingContext(keys);
    }

    isMatched(prop: EntityProp): boolean {
        return this._keys != null
            ? this._keys.has(prop.name)
            : this._key === prop.name;
    }
}

class FoldMapping implements AbstractDtoMapping {

    readonly __mappingType = 'FOLD';

    constructor(
        private readonly _context: AbstractDtoContext,
        private readonly _name: string,
        private readonly _body: DtoBody
    ) {}

    toFields(
        downcastTo: Entity | undefined
    ): ReadonlyArray<DtoField> {
        const dto = createDto(
            this._context,
            downcastTo,
            this._body
        )
        return transformFields(dto.fields, this._name, undefined);
    }
}

class FlatMapping implements AbstractDtoMapping {

    readonly __mappingType = 'FLAT';

    constructor(
        readonly _prop: EntityProp,
        private readonly _prefix: string,
        private readonly _context: AbstractDtoContext,
        private readonly _body: DtoBody,
        private readonly _filter: Filter | undefined,
        private readonly _fetchType: ReferenceFetchType
    ) {}
    
    static of(prop: EntityProp) {
        if (prop.associationType != "ONE_TO_ONE" && prop.associationType != "MANY_TO_ONE" && prop.props == null) {
            throw new ArgumentError(`The flated prop ${prop.toString()} is neither reference nor embedded`);
        }
        const context = prop.targetEntity != null
            ? newDtoContext(prop.targetEntity, false)
            : newDtoContext(prop, false);
        return new FlatMapping(
            prop,
            prop.name,
            context,
            c => [c.$allScalars],
            undefined,
            "LOAD"
        )
    }

    prefix(prefix: string): FlatMapping {
        return new FlatMapping(this._prop, prefix, this._context, this._body, this._filter, this._fetchType);
    }

    with(body: DtoBody): FlatMapping {
        return new FlatMapping(this._prop, this._prefix, this._context, body, this._filter, this._fetchType);
    }

    where(filter: Filter): FlatMapping {
        if (this._prop.targetEntity == null) {
            throw new StateError(`The flat mapping based on "${this._prop.toString()}" which is not reference does not support "where"`);
        }
        return new FlatMapping(this._prop, this._prefix, this._context, this._body, filter, this._fetchType);
    }

    fetch(fetchType: ReferenceFetchType): FlatMapping {
        if (this._prop.targetEntity == null) {
            throw new StateError(`The flat mapping based on "${this._prop.toString()}" which is not reference does not support "fetch"`);
        }
        return new FlatMapping(this._prop, this._prefix, this._context, this._body, this._filter, fetchType);
    }

    toFields(
        downcastTo: Entity | undefined
    ): DtoField | ReadonlyArray<DtoField> {
        const ctx = newDtoContext(
            this._prop.props != null ? this._prop : this._prop.targetEntity!, 
            false
        );
        const dto = createDto(
            ctx, 
            downcastTo,
            this._body
        );
        const flatNullable = this._prop.nullable || this._filter != null;
        if (this._prop.props != null && this._prefix === "" && !flatNullable) {
            return dto.fields;
        }
        const fields = transformFields(
            dto.fields, 
            {
                prefix: this._prefix, 
                nullable: flatNullable, 
                reference: this._prop.targetEntity != null
            },
            undefined
        );
        if (this._prop.props != null) {
            return fields;
        }
        return {
            path: undefined,
            downcastTo,
            prop: this._prop,
            bridgeProp: undefined,
            dto: {
                ...dto,
                fields
            },
            fetchType: this._fetchType,
            predicateFn: this._filter,
            orders: undefined,
            limit: undefined,
            recursiveDepth: undefined,
            nullable: this._prop.nullable,
            parameter: undefined
        };
    }
}

class InstanceOfMapping implements AbstractDtoMapping {

    readonly __mappingType = "INSTANCE_OF";

    constructor(
        private readonly _downcastTo: Entity,
        private readonly _body: DtoBody
    ) {}

    toFields(
        _: Entity | undefined
    ): ReadonlyArray<DtoField> {
        const ctx = newDtoContext(this._downcastTo, true);
        const dto = createDto(
            ctx,
            this._downcastTo,
            this._body
        )
        return dto.fields;
    }
}

class RecursiveMapping implements AbstractDtoMapping {

    readonly __mappingType = "RECURSIVE";

    constructor(
        readonly prop: EntityProp,
        private readonly _alias: string,
        private readonly _filter: Filter | undefined,
        private readonly _orders: ReadonlyArray<EntityPropOrder> | undefined,
        private readonly _maxRows: number | undefined,
        private readonly _depth: number
    ) {}

    static of(prop: EntityProp): RecursiveMapping {
        return new RecursiveMapping(
            prop,
            prop.name,
            undefined,
            undefined,
            undefined,
            -1
        );
    }

    as(alias: string): RecursiveMapping {
        return new RecursiveMapping(
            this.prop,
            alias,
            this._filter,
            this._orders,
            this._maxRows,
            this._depth
        );
    }

    where(filter: Filter): RecursiveMapping {
        return new RecursiveMapping(
            this.prop,
            this._alias,
            filter,
            this._orders,
            this._maxRows,
            this._depth
        );
    }

    orderBy(
        ...orders: ReadonlyArray<string | {
            readonly path: string;
            readonly desc: boolean;
            readonly nulls: OrderNullsType;
        }>
    ): RecursiveMapping {
        const associationType = this.prop.associationType;
        if (associationType != "ONE_TO_MANY" && associationType != "MANY_TO_MANY") {
            throw new StateError(
                `The "orderBy" operation is not supported because the current property "${
                    this.prop
                }" is not collection`
            );
        }
        return new RecursiveMapping(
            this.prop,
            this._alias,
            this._filter,
            toEntityPropOrders(this.prop.targetEntity!, orders),
            this._maxRows,
            this._depth
        );
    }

    limit(maxRows: number): RecursiveMapping {
        const associationType = this.prop.associationType;
        if (associationType != "ONE_TO_MANY" && associationType != "MANY_TO_MANY") {
            throw new StateError(
                `The "limit" operation is not supported because the current property "${
                    this.prop
                }" is not collection`
            );
        }
        return new RecursiveMapping(
            this.prop,
            this._alias,
            this._filter,
            this._orders,
            maxRows,
            this._depth
        );
    }

    depth(depth: number): RecursiveMapping {
        if (depth < 1) {
            throw new ArgumentError(`The recursive depth must be at least 1`);
        }
        return new RecursiveMapping(
            this.prop,
            this._alias,
            this._filter,
            this._orders,
            this._maxRows,
            depth
        );
    }

    toFields(
        downcastTo: Entity | undefined
    ): DtoField {
        const field: DtoField = {
            path: this._alias,
            downcastTo: downcastTo,
            prop: this.prop,
            bridgeProp: undefined,
            dto: undefined,
            fetchType: undefined,
            predicateFn: this._filter,
            orders: this._orders ?? this.prop.orders,
            limit: this._maxRows,
            recursiveDepth: this._depth,
            nullable: this.prop.nullable,
            parameter: undefined
        };
        return field;
    }
}

class ScalarLikeMapping implements AbstractDtoMapping {

    readonly __mappingType = "SCALAR_LIKE";

    constructor(
        private readonly _prop: EntityProp,
        private readonly _alias: string,
        readonly _output: ScalarLikeMapper | undefined,
        readonly _input: ScalarLikeMapper | undefined
    ) {}

    as(alias: string): ScalarLikeMapping {
        return new ScalarLikeMapping(
            this._prop,
            alias,
            this._output,
            this._input
        );
    }

    output(
        schema: StandardSchemaV1, 
        fn: (value: any) => any
    ): ScalarLikeMapping {
        return new ScalarLikeMapping(
            this._prop,
            this._alias,
            { schema, fn },
            undefined
        );
    }

    input(
        schema: StandardSchemaV1, 
        fn: (value: any) => any
    ): ScalarLikeMapping {
        return new ScalarLikeMapping(
            this._prop,
            this._alias,
            undefined,
            { schema, fn }
        );
    }

    toFields(
        downcastTo: Entity | undefined
    ): DtoField | ReadonlyArray<DtoField> {
        return {
            path: this._alias,
            downcastTo,
            prop: this._prop,
            bridgeProp: undefined,
            dto: undefined,
            fetchType: undefined,
            predicateFn: undefined,
            orders: undefined,
            limit: undefined,
            recursiveDepth: undefined,
            nullable: this._prop.nullable,
            parameter: undefined
        };
    }
}

interface ScalarLikeMapper {
    readonly schema: StandardSchemaV1;
    readonly fn: (value: any) => any;
}

class EmbeddedMapping implements AbstractDtoMapping {

    readonly __mappingType = "EMBEDDED";

    constructor(
        private readonly _prop: EntityProp,
        private readonly _alias: string,
        private readonly _body: DtoBody
    ) {}

    as(alias: string): EmbeddedMapping {
        return new EmbeddedMapping(
            this._prop,
            alias,
            this._body
        );
    }

    with(body: DtoBody): EmbeddedMapping {
        return new EmbeddedMapping(
            this._prop,
            this._alias,
            body
        );
    }

    toFields(
        downcastTo: Entity | undefined
    ): DtoField | ReadonlyArray<DtoField> {
        const ctx = newDtoContext(this._prop, false);
        const dto = createDto(ctx, downcastTo, this._body);
        return {
            path: this._alias,
            downcastTo,
            prop: this._prop,
            bridgeProp: undefined,
            dto,
            fetchType: undefined,
            predicateFn: undefined,
            orders: undefined,
            limit: undefined,
            recursiveDepth: undefined,
            nullable: this._prop.nullable,
            parameter: undefined
        };
    }
}

abstract class AssociationMapping implements AbstractDtoMapping {

    abstract readonly __mappingType: string;

    protected constructor(
        protected readonly _prop: EntityProp,
        protected readonly _alias: string,
        protected _body: DtoBody,
        protected readonly _filter: Filter | undefined
    ) {
    }

    protected get _directProp(): FetchProp {
        const middleEntity = this._prop.middleEntity;
        return middleEntity != null
            ? InverseFetchProp.of(middleEntity.joinThisProp)
            : this._prop;
    }

    protected get _bridgeProp(): EntityProp | undefined {
        return this._prop.middleEntity != null
            ? this._prop
            : undefined;
    }

    protected _createChildDto(
        downloadTo: Entity | undefined
    ): Dto {
        const middleEntity = this._prop.middleEntity;
        const ctx = middleEntity != null 
            ? newDtoContext(middleEntity.entity!, false)
            : newDtoContext(this._prop.targetEntity!, false);
        const body = middleEntity != null
            ? (c: AbstractDtoContext) => {
                const flat = c.$flat(middleEntity.joinTargetProp.name)
                    .prefix("")
                    .with(this._body);
                return this._filter == null 
                    ? [flat]
                    : [flat.where(this._filter)];
            }
            : this._body;
        return createDto(ctx, downloadTo, body);
    }

    abstract toFields(
        downcastTo: Entity | undefined
    ): DtoField;
}

class ReferenceMapping extends AssociationMapping {

    readonly __mappingType = "REFERENCE";

    constructor(
        _prop: EntityProp,
        _alias: string,
        _body: DtoBody,
        _filter: Filter | undefined,
        private readonly _fetchType: ReferenceFetchType
    ) {
        super(_prop, _alias, _body, _filter);
    }

    as(alias: string): ReferenceMapping {
        return new ReferenceMapping(
            this._prop,
            alias,
            this._body,
            this._filter,
            this._fetchType
        );
    }

    with(body: DtoBody): ReferenceMapping {
        return new ReferenceMapping(
            this._prop,
            this._alias,
            body,
            this._filter,
            this._fetchType
        );
    }

    where(filter: Filter): ReferenceMapping {
        return new ReferenceMapping(
            this._prop,
            this._alias,
            this._body,
            filter,
            this._fetchType
        );
    }

    fetch(fetchType: ReferenceFetchType): ReferenceMapping {
        return new ReferenceMapping(
            this._prop,
            this._alias,
            this._body,
            this._filter,
            fetchType
        );
    }

    toFields(
        downcastTo: Entity | undefined
    ): DtoField {
        const dto = this._createChildDto(downcastTo);
        return {
            path: this._alias,
            downcastTo,
            prop: this._directProp,
            bridgeProp: this._bridgeProp,
            dto,
            fetchType: this._fetchType,
            predicateFn: this._filter,
            orders: undefined,
            limit: undefined,
            recursiveDepth: undefined,
            nullable: this._prop.nullable,
            parameter: undefined
        };
    }
}

class CollectionMapping extends AssociationMapping {

    readonly __mappingType = "COLLECTION";

    constructor(
        _prop: EntityProp,
        _alias: string,
        _body: DtoBody,
        _filter: Filter | undefined,
        private readonly _orders: ReadonlyArray<EntityPropOrder> | undefined,
        private readonly _maxRows: number | undefined
    ) {
        super(_prop, _alias, _body, _filter);
    }

    as(alias: string): CollectionMapping {
        return new CollectionMapping(
            this._prop,
            alias,
            this._body,
            this._filter,
            this._orders,
            this._maxRows
        );
    }

    with(body: DtoBody): CollectionMapping {
        return new CollectionMapping(
            this._prop,
            this._alias,
            body,
            this._filter,
            this._orders,
            this._maxRows
        );
    }

    where(filter: Filter): CollectionMapping {
        return new CollectionMapping(
            this._prop,
            this._alias,
            this._body,
            filter,
            this._orders,
            this._maxRows
        );
    }

    orderBy(
        ...orders: ReadonlyArray<string | {
            readonly path: string;
            readonly desc: boolean;
            readonly nulls: OrderNullsType;
        }>
    ): CollectionMapping {
        const propOrders = toEntityPropOrders(this._prop.targetEntity!, orders);
        return new CollectionMapping(
            this._prop,
            this._alias,
            this._body,
            this._filter,
            propOrders,
            this._maxRows
        );
    }

    limit(maxRows: number): CollectionMapping {
        if (this._prop.middleEntity != null) {
            throw new StateError(`Cannot set the limit of "${this._prop.toString()}" based on base table`);
        }
        return new CollectionMapping(
            this._prop,
            this._alias,
            this._body,
            this._filter,
            this._orders,
            maxRows
        );
    }

    toFields(
        downcastTo: Entity | undefined
    ): DtoField {
        const dto = this._createChildDto(downcastTo);
        return {
            path: this._alias,
            downcastTo,
            prop: this._directProp,
            bridgeProp: this._bridgeProp,
            dto,
            fetchType: undefined,
            predicateFn: undefined,
            orders: undefined,
            limit: this._maxRows,
            recursiveDepth: undefined,
            nullable: this._prop.nullable,
            parameter: undefined
        };
    }
}

class ReferenceKeyMapping implements AbstractDtoMapping {

    readonly __mappingType = "COLLECTION";

    constructor(
        private readonly _prop: EntityProp,
        private readonly _alias: string,
        private readonly _body: DtoBody
    ) {}

    as(alias: string): ReferenceKeyMapping {
        return new ReferenceKeyMapping(this._prop, alias, this._body);
    }

    with(body: DtoBody): ReferenceKeyMapping {
        if (this._prop.props == null) {
            throw new StateError(`Cannot set the body of "${this._prop.toString()}" which is not embedded property`)
        }
        return new ReferenceKeyMapping(this._prop, this._alias, body);
    }

    toFields(
        downcastTo: Entity | undefined
    ): DtoField {
        const ctx = newDtoContext(this._prop, false);
        const dto = this._body != null ? createDto(ctx, downcastTo, this._body) : undefined;
        return {
            path: this._alias,
            downcastTo,
            prop: this._prop,
            bridgeProp: undefined,
            dto,
            fetchType: undefined,
            predicateFn: undefined,
            orders: undefined,
            limit: undefined,
            recursiveDepth: undefined,
            nullable: this._prop.nullable,
            parameter: undefined
        };
    }
}

export function createDtoContext(
    source: Entity
): AbstractDtoContext {
    return newDtoContext(source, false);
}

function newDtoContext(
    source: Entity |  EntityProp,
    declaredOnly: boolean
): AbstractDtoContext {
    const ctor = dtoContextCtor(source, declaredOnly);
    return new ctor(source, declaredOnly);
}

type DtoContextCtor = new(
    source: Entity | EntityProp,
    declaredOnly: boolean
) => AbstractDtoContext;

const dtoContextCtorMap = new Map<string, DtoContextCtor>();

function dtoContextCtor(
    source: Entity |  EntityProp,
    declaredOnly: boolean
): DtoContextCtor {
    const name = source instanceof Entity
        ? source.name
        : source.toString();
    const key = declaredOnly ? `declaredOnly(${name})` : name;
    let ctor = dtoContextCtorMap.get(key);
    if (ctor == null) {
        ctor = createDtoContextCtor(source, declaredOnly);
        dtoContextCtorMap.set(key, ctor);
    }
    return ctor;
}

export class AbstractDtoContext {

    private _allScalarsMapping: AllScalarsMapping | undefined = undefined;

    readonly entity: Entity;

    readonly embeddedProp: EntityProp | undefined;

    constructor(
        source: Entity |  EntityProp,
        readonly declaredOnly: boolean,
    ) {
        if (source instanceof EntityProp) {
            this.entity = source.declaringEntity;
            this.embeddedProp = source;
        } else {
            this.entity = source;
            this.embeddedProp = undefined;
        }
    }

    get $allScalars(): AllScalarsMapping {
        let mapping = this._allScalarsMapping;
        if (mapping == null) {
            this._allScalarsMapping = mapping = new AllScalarsMapping(this, undefined);
        }
        return mapping;
    }

    $fold(name: string, body: DtoBody): FoldMapping {
        return new FoldMapping(this, name, body);
    }

    $flat(key: string): FlatMapping {
        const prop = this._prop(key);
        return FlatMapping.of(prop);
    }

    $instanceOf(model: AnyModel, body: DtoBody): InstanceOfMapping {
        const downcastTo = Entity.of(model);
        if (!this.entity.isAssignableFrom(downcastTo)) {
            throw new ArgumentError(`The argument "${downcastTo.name}" is not derived model of "${this.entity.name}"`);
        }
        return new InstanceOfMapping(downcastTo, body);
    }

    $recursive(key: string): RecursiveMapping {
        const prop = this._prop(key);
        if (!prop.isRecursive) {
            throw new ArgumentError(`The property ${prop.toString()} is not recursive`);
        }
        return RecursiveMapping.of(prop);
    }

    private _prop(key: string): EntityProp {
        if (this.embeddedProp != null) {
            const prop = this.embeddedProp.props!.get(key);
            if (prop == null) {
                throw new ArgumentError(`The is not property "${key}" in the embedded property "${this.embeddedProp.toString()}"`);
            }
            return prop;
        }
        if (this.declaredOnly) {
            const prop = this.entity.declaredPropMap.get(key);
            if (prop == null) {
                throw new ArgumentError(`There is no directly(ingnore inherited properties) property "${key}" in the entity "${this.entity.name}"`);
            }
            return prop;
        }
        const prop = this.entity.allPropMap.get(key);
        if (prop == null) {
            throw new ArgumentError(`There is no property "${key}" in the entity "${this.entity.name}"`);
        }
        return prop;
    }
}

function createDtoContextCtor(
    source: Entity |  EntityProp,
    declaredOnly: boolean
): DtoContextCtor {
    if (declaredOnly && source instanceof EntityProp) {
        throw new ArgumentError("declaredOnly must be false when source is property");
    }
    const superCtor = !declaredOnly 
        && source instanceof Entity
        && source.superEntity
        ? dtoContextCtor(source.superEntity, false)
        : AbstractDtoContext
    return new DtoContextCtorCreator(source, superCtor).create();
}

class DtoContextCtorCreator {

    constructor(
        private readonly _source: Entity |  EntityProp,
        private readonly _superCtor: DtoContextCtor | undefined
    ) {}

    create(): DtoContextCtor {
        const writer = new CodeWriter();
        writer.code("return class ThisClass extends $baseClass").code(" ");
        writer.scope("CURLY_BRACKETS", () => {
            this._writerStaticFields(writer);
            this._writeConstructor(writer);
            this._writeProps(writer);
        });
        return new Function(
            "$baseClass", 
            "$source", 
            "$scalarLikeMapping",
            "$embeddedMapping",
            "$referenceMapping",
            "$collectionMapping",
            "$referenceKeyMapping",
            writer.toString()
        )(
            this._superCtor, 
            this._source,
            ScalarLikeMapping,
            EmbeddedMapping,
            ReferenceMapping,
            CollectionMapping,
            ReferenceKeyMapping
        );
    }

    private _writerStaticFields(writer: CodeWriter) {
        if (this._source instanceof Entity) {
            for (const prop of this._source.declaredPropMap.values()) {
                writer
                    .code(`static ${this._propName(prop)} = $source.allPropMap.get("${prop.name}")`)
                    .newLine(";");
            }
        } else {
            for (const prop of this._source.props!.values()) {
                writer
                    .code(`static ${this._propName(prop)} = $source.props.get("${prop.name}")`)
                    .newLine(";");
            }
        }
    }

    private _propName(prop: EntityProp): string {
        return `_${prop.name}`;
    }

    private _writeConstructor(writer: CodeWriter) {
        const declaredOnly = this._source instanceof Entity
            ? this._source.superEntity != null && this._superCtor == null
            : false;
        writer.code("constructor() ").scope("CURLY_BRACKETS", () => {
            writer.code(`super($source, ${declaredOnly})`).newLine(";");
        }).newLine();
    }

    private _writeProps(writer: CodeWriter) {
        if (this._source instanceof Entity) {
            for (const prop of this._source.declaredPropMap.values()) {
                this._writeProp(prop, writer);
            }
        } else {
            for (const prop of this._source.props!.values()) {
                this._writeProp(prop, writer);
            }
        }
    }

    private _writeProp(prop: EntityProp, writer: CodeWriter) {
        writer.code("get ").code(prop.name).code("() ").scope("CURLY_BRACKETS", () => {
            if (prop.referenceProp != null) {
                if (prop.props != null) {
                    writer 
                        .code(
                            `return new $referenceKeyMapping(ThisClass.${
                                this._propName(prop)
                            }, "${
                                prop.name
                            }", c => [c.$allScalars])`
                        )
                        .newLine(";");
                } else {
                        writer 
                        .code(
                            `return new $referenceKeyMapping(ThisClass.${
                                this._propName(prop)
                            }, "${
                                prop.name
                            }", undefined)`
                        )
                        .newLine(";");
                }
            } else if (prop.scalarType != null || prop.getTsFormulaFn(false) != null || prop.sqlFormulaFn != null) {
                writer
                    .code(
                        `return new $scalarLikeMapping(ThisClass.${
                            this._propName(prop)
                        }, "${
                            prop.name
                        }", undefined, undefined)`
                    )
                    .newLine(";");
            } else if (prop.props != null) {
                writer 
                    .code(
                        `return new $embeddedMapping(ThisClass.${
                            this._propName(prop)
                        }, "${
                            prop.name
                        }", c => [c.$allScalars])`
                    )
                    .newLine(";");
            } else if (prop.associationType === "ONE_TO_ONE" || prop.associationType === "MANY_TO_ONE") {
                writer 
                    .code(
                        `return new $referenceMapping(ThisClass.${
                            this._propName(prop)
                        }, "${
                            prop.name
                        }", c => [c.$allScalars], undefined, undefined)`
                    )
                    .newLine(";");
            } else if (prop.associationType === "ONE_TO_MANY" || prop.associationType === "MANY_TO_MANY") {
                writer 
                    .code(
                        `return new $collectionMapping(ThisClass.${
                            this._propName(prop)
                        }, "${
                            prop.name
                        }", c => [c.$allScalars], undefined, undefined, undefined)`
                    )
                    .newLine(";");
            }
        }).newLine();
    }
}

export function createDto(
    ctx: AbstractDtoContext,
    downloadTo: Entity | undefined,
    body: any
) {
    const mappings = body(ctx);
    const factory = new DtoFactory(ctx.entity, downloadTo);
    for (const mapping of mappings) {
        factory.addMapping(mapping as AbstractDtoMapping);
    }
    return factory.create();
}

export class DtoFactory {

    private readonly _fields: Array<DtoField> = [];

    constructor(
        private readonly _source: Entity | EntityProp,
        private readonly _downcastTo: Entity | undefined
    ) {}

    addMapping(mapping: AbstractDtoMapping) {
        if (mapping instanceof InstanceOfMapping) {
            this._addTypeName();
        } else if (mapping instanceof RecursiveMapping) {
            for (const field of this._fields) {
                if (field.prop === mapping.prop) {
                    throw new StateError(
                        `Cannot fetch the property ${mapping.prop.toString()} recursively 
                        because annother dto field fetches the association unrecursively`
                    );
                }
            }
        }
        const fields = mapping.toFields(this._downcastTo);
        if (Array.isArray(fields)) {
            this._fields.push(...fields);
        } else {
            this._fields.push(fields as DtoField);
        }
    }

    create(): Dto {  
        return {
            entity: this._source instanceof Entity
                ? this._source
                : this._source.rootProp.declaringEntity,
            fields: this._fields
        };
    }

    private _addTypeName() {
        if (!(this._source instanceof Entity)) {
            throw new StateError("Only entity dto accept the typename");
        }
        for (const field of this._fields) {
            if (field.prop instanceof TypeNameProp) {
                return;
            }
        }
        const entity = this._source;
        const field: DtoField = {
            path: "__typename",
            downcastTo: undefined,
            prop: new TypeNameProp(
                entity,
                entity.tableSettings.discriminator?.name,
                entity.tableSettings.discriminator == null ? entity.name : undefined
            ),
            bridgeProp: undefined,
            dto: undefined,
            fetchType: undefined,
            predicateFn: undefined,
            orders: undefined,
            limit: undefined,
            recursiveDepth: undefined,
            nullable: false,
            parameter: undefined
        };
        this._fields.push(field);
    }
}

type TransformOp = 
    string | {
        readonly prefix: string;
        readonly nullable: boolean;
        readonly reference: boolean;
    };

function transformFields(
    fields: ReadonlyArray<DtoField>,
    op: TransformOp,
    predicate: ((field: DtoField) => boolean) | undefined
) {
    let newFields: Array<DtoField> | undefined = undefined;
    const size = fields.length;
    for (let i = 0; i < size; i++) {
        if (predicate == null || predicate(fields[i]!)) {
            if (newFields == null) {
                newFields = [...fields];
            }
            newFields[i] = transformField(fields[i]!, op);
        }
    }
    return newFields ?? fields;
}

function transformField(
    field: DtoField,
    op: TransformOp
): DtoField {
    let path = 
        typeof op === "string"
            ? field.path
            : replacePathHead(field.path, op.prefix);
    if (typeof op === "string") {
        path = addPathHead(path, op);
    } else if (op.reference) {
        path = addPathHead(path, "..");
    }
    let dto = field.dto;
    if (dto != null) {
        const deeperFields = transformFields(
            dto.fields, 
            op,
            deepField => isFlattenReference(deepField)
        );
        if (deeperFields !== dto.fields) {
            dto = {
                ...dto,
                fields: deeperFields
            };
        }
    }
    let nullable = field.nullable;
    if (typeof op !== "string") {
        nullable ||= op.nullable;
    }
    return {
        ...field,
        path,
        nullable: field.nullable || nullable,
        dto
    };
}

function isFlattenReference(field: DtoField): boolean {
    return Array.isArray(field.path) 
        && field.path.length > 1 
        && field.path[0]! === ".."
}

function addPathHead(
    path: Path | undefined, 
    head: string
): Path | undefined {
    if (path == null) {
        return undefined;
    }
    if (typeof path === "string") {
        return [head, path];
    }
    const index = path.findIndex(v => v !== "..");
    return [
        ...path.slice(0, index),
        head,
        ...path.slice(index)
    ];
}

function replacePathHead(
    path: Path | undefined, 
    prefix: string
): Path | undefined {
    if (path == null) {
        return undefined;
    }
    if (prefix === "") {
        return path;
    }
    if (typeof path === "string") {
        return `${prefix}${capitalize(path)}`;
    }
    const index = path.findIndex(v => v !== "..");
    return [
        ...path.slice(0, index),
        `${prefix}${capitalize(path[index]!)}`,
        ...path.slice(index + 1)
    ];
}
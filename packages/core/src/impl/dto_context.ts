import { Entity } from "./entity";
import { EntityProp } from "./entity_prop";
import { ArgumentError, StateError } from "@/error/common";
import { AbstractEntityTable } from "./entity_table";
import { Predicate } from "@/dsl";
import { ReferenceFetchType } from "@/schema/dto/reference_fetch_type";
import { CodeWriter } from "./code_writer";
import { StandardSchemaV1 } from "@standard-schema/spec";
import { OrderNullsType } from "@/schema/order";
import { Dto, DtoField } from "./dto";

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
        return new FoldMapping(name, this, body);
    }

    $flat(key: string): FlatMapping {
        const prop = this._prop(key);
        return FlatMapping.of(prop);
    }

    private _prop(key: string): EntityProp {
        if (this.embeddedProp != null) {
            const prop = this.embeddedProp.props!.get(key);
            if (prop == null) {
                throw new ArgumentError(`The is not property "${key}" in the embedded property "${this.embeddedProp.toString()}"`);
            }
            return prop;
        }
        const prop = this.entity.allPropMap.get(key);
        if (prop == null) {
            throw new ArgumentError(`The is not property "${key}" in the entity "${this.entity.name}"`);
        }
        return prop;
    }
}

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
        keys: ReadonlyArray<string>
    ): AllScalarsMapping {
        return new AllScalarsMapping(this._context, keys);
    }

    toFields(
        downcastTo: Entity | undefined
    ): DtoField | ReadonlyArray<DtoField> {
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
        readonly name: string,
        readonly context: AbstractDtoContext,
        readonly body: DtoBody
    ) {}

    toFields(
        downcastTo: Entity | undefined
    ): DtoField | ReadonlyArray<DtoField> {
        throw new Error();
    }
}

class FlatMapping implements AbstractDtoMapping {

    readonly __mappingType = 'FLAT';

    constructor(
        readonly prop: EntityProp,
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
        return new FlatMapping(this.prop, prefix, this._context, this._body, this._filter, this._fetchType);
    }

    with(body: DtoBody): FlatMapping {
        return new FlatMapping(this.prop, this._prefix, this._context, body, this._filter, this._fetchType);
    }

    where(filter: Filter): FlatMapping {
        if (this.prop.targetEntity == null) {
            throw new StateError(`The flat mapping based on "${this.prop.toString()}" which is not reference does not support "where"`);
        }
        return new FlatMapping(this.prop, this._prefix, this._context, this._body, filter, this._fetchType);
    }

    fetch(fetchType: ReferenceFetchType): FlatMapping {
        if (this.prop.targetEntity == null) {
            throw new StateError(`The flat mapping based on "${this.prop.toString()}" which is not reference does not support "fetch"`);
        }
        return new FlatMapping(this.prop, this._prefix, this._context, this._body, this._filter, fetchType);
    }

    toFields(
        downcastTo: Entity | undefined
    ): DtoField | ReadonlyArray<DtoField> {
        throw new Error();
    }
}

class ScalarLikeMapping implements AbstractDtoMapping {

    readonly __mappingType = "SCALAR_LIKE";

    constructor(
        readonly alias: string,
        readonly outputMapper: ScalarLikeMapper | undefined,
        readonly inputMapper: ScalarLikeMapper | undefined
    ) {}

    output(
        schema: StandardSchemaV1, 
        fn: (value: any) => any
    ): ScalarLikeMapping {
        return new ScalarLikeMapping(
            this.alias,
            { schema, fn },
            undefined
        );
    }

    input(
        schema: StandardSchemaV1, 
        fn: (value: any) => any
    ): ScalarLikeMapping {
        return new ScalarLikeMapping(
            this.alias,
            undefined,
            { schema, fn }
        );
    }

    toFields(
        downcastTo: Entity | undefined
    ): DtoField | ReadonlyArray<DtoField> {
        throw new Error();
    }
}

interface ScalarLikeMapper {
    readonly schema: StandardSchemaV1;
    readonly fn: (value: any) => any;
}

class EmbeddedMapping implements AbstractDtoMapping {

    readonly __mappingType = "EMBEDDED";

    constructor(
        readonly context: AbstractDtoContext,
        readonly alias: string,
        private readonly _body: DtoBody
    ) {}

    as(alias: string): EmbeddedMapping {
        return new EmbeddedMapping(
            this.context,
            alias,
            this._body
        );
    }

    with(body: DtoBody): EmbeddedMapping {
        return new EmbeddedMapping(
            this.context,
            this.alias,
            body
        );
    }

    toFields(
        downcastTo: Entity | undefined
    ): DtoField | ReadonlyArray<DtoField> {
        throw new Error();
    }
}

class ReferenceMapping implements AbstractDtoMapping {

    readonly __mappingType = "REFERENCE";

    constructor(
        readonly context: AbstractDtoContext,
        readonly alias: string,
        private readonly _body: DtoBody,
        private filter: Filter | undefined,
        private fetchType: ReferenceFetchType
    ) {}

    as(alias: string): ReferenceMapping {
        return new ReferenceMapping(
            this.context,
            alias,
            this._body,
            this.filter,
            this.fetchType
        );
    }

    with(body: DtoBody): ReferenceMapping {
        return new ReferenceMapping(
            this.context,
            this.alias,
            body,
            this.filter,
            this.fetchType
        );
    }

    where(filter: Filter): ReferenceMapping {
        return new ReferenceMapping(
            this.context,
            this.alias,
            this._body,
            filter,
            this.fetchType
        );
    }

    fetch(fetchType: ReferenceFetchType): ReferenceMapping {
        return new ReferenceMapping(
            this.context,
            this.alias,
            this._body,
            this.filter,
            fetchType
        );
    }

    toFields(
        downcastTo: Entity | undefined
    ): DtoField | ReadonlyArray<DtoField> {
        throw new Error();
    }
}

class CollectionMapping implements AbstractDtoMapping {

    readonly __mappingType = "COLLECTION";

    constructor(
        readonly context: AbstractDtoContext,
        readonly alias: string,
        private readonly _body: DtoBody,
        private filter: Filter | undefined,
        private orders: ReadonlyArray<OrderItem> | undefined,
        private maxRows: number | undefined
    ) {}

    as(alias: string): CollectionMapping {
        return new CollectionMapping(
            this.context,
            alias,
            this._body,
            this.filter,
            this.orders,
            this.maxRows
        );
    }

    with(body: DtoBody): CollectionMapping {
        return new CollectionMapping(
            this.context,
            this.alias,
            body,
            this.filter,
            this.orders,
            this.maxRows
        );
    }

    where(filter: Filter): CollectionMapping {
        return new CollectionMapping(
            this.context,
            this.alias,
            this._body,
            filter,
            this.orders,
            this.maxRows
        );
    }

    orderBy(orders: ReadonlyArray<string | OrderItem>): CollectionMapping {
        const orderObjs: ReadonlyArray<OrderItem> = orders.map(order => {
            if (typeof order === "string") {
                return { path: order, desc: false, nulls: "UNSPECIFIED" };
            }
            return order;
        })
        return new CollectionMapping(
            this.context,
            this.alias,
            this._body,
            this.filter,
            orderObjs,
            this.maxRows
        );
    }

    limit(maxRows: number): CollectionMapping {
        return new CollectionMapping(
            this.context,
            this.alias,
            this._body,
            this.filter,
            this.orders,
            maxRows
        );
    }

    toFields(
        downcastTo: Entity | undefined
    ): DtoField | ReadonlyArray<DtoField> {
        throw new Error();
    }
}

interface OrderItem {
    readonly path: string;
    readonly desc: boolean;
    readonly nulls: OrderNullsType;
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
        writer.code("return class TheClass extends $baseClass").code(" ");
        writer.scope("CURLY_BRACKETS", () => {
            this._writerStaticFields(writer);
            this._writeConstructor(writer);
            this._writeProps(writer);
        });
        console.log(writer.toString())
        return new Function(
            "$baseClass", 
            "$source", 
            "$newDtoContext",
            "$scalarLikeMapping",
            "$embeddedMapping",
            "$referenceMapping",
            "$collectionMapping",
            writer.toString()
        )(
            this._superCtor, 
            this._source,
            newDtoContext,
            ScalarLikeMapping,
            EmbeddedMapping,
            ReferenceMapping,
            CollectionMapping
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

            } else if (prop.scalarType != null) {
                writer
                    .code(
                        `return new $scalarLikeMapping(${
                            prop.name
                        }, undefined, undefined)`
                    )
                    .newLine(";");
            } else if (prop.props != null) {
                writer 
                    .code(
                        `return new $embeddedMapping($newDtoContext(ThisClass.${
                            this._propName(prop)
                        }, false), "${
                            prop.name
                        }", c => [c.$allScalars])`
                    )
                    .newLine(";");
            } else if (prop.associationType === "ONE_TO_ONE" || prop.associationType === "MANY_TO_ONE") {
                writer 
                    .code(
                        `return new $referenceMapping($newDtoContext(ThisClass.${
                            this._propName(prop)
                        }.targetEntity, false), "${
                            prop.name
                        }", c => [c.$allScalars], undefined, undefined)`
                    )
                    .newLine(";");
            } else if (prop.associationType === "ONE_TO_MANY" || prop.associationType === "MANY_TO_MANY") {
                writer 
                    .code(
                        `return new $collectionMapping($newDtoContext(ThisClass.${
                            this._propName(prop)
                        }.targetEntity, false), "${
                            prop.name
                        }", c => [c.$allScalars], undefined, [], undefined)`
                    )
                    .newLine(";");
            }
        }).newLine();
    }
}
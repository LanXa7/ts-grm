import { CodeWriter } from "./code_writer";
import { Entity } from "./entity";
import { EntityProp } from "./entity_prop";
import { Predicate } from "@/dsl/expression";
import { createTableProp } from "./ast/prop_expr";
import { JoinType, ModelLike } from "@/dsl/table";
import { makeErr } from "@/error/util";
import { AbstractTable, createJoinedTable } from "./abstract_table";
import { ShadowAnchor } from "./shadow_anchor";
import { FetchedView } from "@/dsl/root_query";
import { View } from "@/schema/dto";
import { FetchedViewImpl } from "./fetched_view_impl";
import { TypedBaseTable } from "./base_table";
import { ArgumentError, StateError } from "@/error/common";
import { ModelContract } from "./model_contract";
import { BaseQuerySelectMapArgs, dsl, ExpressionLike, ExprTuple } from "@/dsl";
import { BaseModelImplementor } from "./base_query_implementor";
import { AnyModel } from "@/schema/model";
import { AbstractPred, ConstantPred } from "./ast/pred";
import { IsPred } from "./ast/is_pred";
import { AssociationEntity, AssociationProp } from "./association_entity";
import { AbstractAssociationTable } from "./association_table";
import { AbstractExpr, AbstractNumExpr } from "./ast";
import { suppressUnused } from "@/utils";
import { ExprTupleImpl } from "./ast/tuple";
import { capitalize } from "./util";

export abstract class AbstractEntityTable implements AbstractTable {

    readonly __prototype: AbstractEntityTable;

    readonly __joinOperation: JoinOperation | undefined;

    readonly __anchor: ShadowAnchor | undefined;

    private readonly _sharedData: SharedData;

    private readonly _downcast: boolean;

    private _upcastMap: Map<Entity, AbstractEntityTable> | undefined = undefined;

    private _associationMap: Map<string, AbstractAssociationTable> | undefined = undefined;

    private _inverseAssociationMap: Map<string, AbstractAssociationTable> | undefined = undefined;

    constructor(
        readonly __entity: Entity,
        options: JoinOperation | ShadowAnchor | AbstractEntityTable | undefined
    ) {
        let prototype: AbstractEntityTable;
        let joinOperation: JoinOperation | undefined;
        let anchor: ShadowAnchor | undefined;
        let sharedData: SharedData;
        let downcast: boolean;
        let upcastMap: Map<Entity, AbstractEntityTable> | undefined;
        if (options == null) {
            prototype = this;
            joinOperation = undefined;
            anchor = undefined;
            sharedData = {
                shadow: undefined,
                nullable: false,
                downcastMap: undefined
            };
            downcast = false;
            upcastMap = undefined;
        } else if ((options as any).parent) {
            prototype = this;
            joinOperation = options as JoinOperation;
            anchor = undefined;
            sharedData = {
                shadow: undefined,
                nullable: joinOperation.joinType === "LEFT",
                downcastMap: joinOperation.castToEntity != null 
                    ? (joinOperation.parent as AbstractEntityTable)._getDowncastMap()
                    : undefined
            };
            downcast = joinOperation.castToEntity != null 
                ? (joinOperation.parent as AbstractEntityTable)._downcast 
                || joinOperation.castToEntity.ancestors.has(this.__entity) 
                : false;
            upcastMap = joinOperation.castToEntity != null 
                && this.__entity.ancestors.has(joinOperation.castToEntity) 
                ? (joinOperation.parent as AbstractEntityTable)._getUpcastMap()
                : undefined;
        } else if ((options as any).original) {
            prototype = this;
            joinOperation = undefined;
            anchor = options as ShadowAnchor;
            sharedData = {
                shadow: undefined,
                nullable: false,
                downcastMap: undefined
            };
            downcast = false;
            upcastMap = undefined;
        } else {
            prototype = options as AbstractEntityTable;
            joinOperation = prototype.__joinOperation;
            anchor = prototype.__anchor;
            sharedData = prototype._sharedData;
            downcast = true;
            upcastMap = undefined;
        }
        this.__prototype = prototype;
        this.__joinOperation = joinOperation;
        this.__anchor = anchor;
        this._sharedData = sharedData;
        this._downcast = downcast;
        this._upcastMap = upcastMap;
    }

    __type(): {
        tableLike: true;
        entityTable: true;
    } {
        return {
            tableLike: true,
            entityTable: true
        }
    }

    $acceptMulti(): this {
        return this;
    }

    join(model: ModelLike, options: JoinFilter | {
        readonly joinType?: JoinType,
        readonly filter: JoinFilter
    }) {
        return createJoinedTable(this, model, options);
    }

    fetch<T>(view: View<any, T>): FetchedView<any, T> {
        return new FetchedViewImpl(this, view);
    }

    is(derivedModel: AnyModel): AbstractPred {
        const derivedEntity = Entity.of(derivedModel);
        if (derivedEntity === this.__entity || this.__entity.ancestors.has(derivedEntity)) {
            return ConstantPred.TRUE;
        }
        if (!derivedEntity.ancestors.has(this.__entity)) {
            return ConstantPred.FALSE;
        }
        return new IsPred(this, derivedEntity, false);
    }

    as(derivedModel: AnyModel): AbstractEntityTable {
        return this.__to(Entity.of(derivedModel));
    }

    association(
        propName: string, 
        options?: JoinType | JoinFilter | {
            readonly joinType?: JoinType;
            readonly filter?: JoinFilter;
        }
    ): AbstractAssociationTable {
        const joinType = typeof options === "string" 
                ? options as JoinType
                : typeof options === "function" ? "INNER" : options?.joinType ?? "INNER";
        const filter = typeof options === "string"
            ? undefined 
            : typeof options === "function" ? options : options?.filter;
        if (filter != null) {
            return this._association(propName, joinType, filter);
        }
        const key = `${propName}\x1F${joinType}`;
        let associationMap = this._associationMap;
        let association = associationMap?.get(key);
        if (association != null) {
            return association;
        }
        if (associationMap == null) {
            this._associationMap = associationMap = new Map();
        }
        association = this._association(propName, joinType, filter);
        associationMap.set(key, association);
        return association;
    }

    private _association(
        propName: string, 
        joinType: JoinType,
        filter: JoinFilter | undefined
    ): AbstractAssociationTable {
        const associationModel = dsl.associationModel(this.__entity.model!, propName);
        const associationEntity = AssociationEntity.of(associationModel); 
        return associationEntity.table({
            parent: this,
            joinType,
            joinProp: associationEntity.sourceProp,
            isJoinPropInverse: true,
            isTargetFilterIgnored: false,
            castToEntity: undefined,
            weakJoinModel: undefined,
            filter
        });
    }

    private _inverseAssociation(
        parentModel: AnyModel,
        toThisPropName: string
    ): AbstractAssociationTable {
        const prop = Entity.of(parentModel).prop(toThisPropName);
        this._validateToThisProp(prop);
        let inverseAssociationMap = this._inverseAssociationMap;
        let inverseAssociation = inverseAssociationMap?.get(toThisPropName);
        if (inverseAssociation != null) {
            return inverseAssociation;
        }
        if (inverseAssociationMap == null) {
            this._inverseAssociationMap = inverseAssociationMap = new Map();
        }
        const associationEntity = this.__entity.inverseAssociation(
            Entity.of(parentModel),
            toThisPropName
        );
        inverseAssociation = associationEntity.table({
            parent: this,
            joinType: "INNER",
            joinProp: associationEntity.sourceProp,
            isJoinPropInverse: true,
            isTargetFilterIgnored: true,
            castToEntity: undefined,
            weakJoinModel: undefined,
            filter: undefined
        });
        inverseAssociationMap.set(toThisPropName, inverseAssociation);
        return inverseAssociation;
    }

    exists(
        key: string
    ): Predicate {
        suppressUnused(key);
        throw new Error("Unsupported");
    }

    none(
        key: string, 
        fn: (table: AbstractEntityTable) => Predicate | undefined
    ): Predicate | undefined {
        suppressUnused(key);
        suppressUnused(fn);
        return undefined;
    }

    some(
        key: string, 
        fn: (table: AbstractEntityTable) => Predicate | undefined
    ): Predicate | undefined {
        suppressUnused(key);
        suppressUnused(fn);
        return undefined;
    }

    all(
        key: string, 
        fn: (table: AbstractEntityTable) => Predicate | undefined
    ): Predicate | undefined {
        suppressUnused(key);
        suppressUnused(fn);
        return undefined;
    }

    size(
        key: string, 
        fn: (table: AbstractEntityTable) => Predicate | undefined
    ): AbstractNumExpr<number> {
        suppressUnused(key);
        suppressUnused(fn);
        throw new Error("Unsupported");
    }

    __to(castTo: Entity): AbstractEntityTable {
        if (this.__entity === castTo) {
            return this;
        }
        const isSuper = this.__entity!.ancestors.has(castTo);
        if (isSuper && !this._downcast && this.__entity.tableEntity === castTo.tableEntity) {
            return this;
        }
        if (isSuper) {
            return this._upcast(castTo);
        }
        if (castTo.ancestors.has(this.__entity!)) {
            return this._downloadCast(castTo);
        }
        throw new ArgumentError(
            `The model "${
                castTo.name
            }" represented by the parameter is not in the same inheritance chain as the current model "${
                this.__entity.name
            }"`
        );
    }

    private _upcast(castTo: Entity): AbstractEntityTable {
        const upcastMap = this._getUpcastMap();
        let table = upcastMap.get(castTo);
        if (table != null) {
            return table;
        }
        table = castTo.table({
            parent: this,
            joinType: this._sharedData.nullable || this._downcast ? "LEFT" : "INNER",
            joinProp: undefined,
            isJoinPropInverse: false,
            isTargetFilterIgnored: false,
            castToEntity: castTo,
            weakJoinModel: undefined,
            filter: undefined
        });
        upcastMap.set(castTo, table);
        return table;
    }

    private _downloadCast(castTo: Entity): AbstractEntityTable {
        const downcastMap = this._getDowncastMap();
        let table = downcastMap.get(castTo);
        if (table != null) {
            return table;
        }
        if (this.__entity.tableEntity === castTo.tableEntity) {
            table = castTo.table(this);
        } else {
            table = castTo.table({
                parent: this,
                joinType: "LEFT",
                joinProp: undefined,
                isJoinPropInverse: false,
                isTargetFilterIgnored: false,
                castToEntity: castTo,
                weakJoinModel: undefined,
                filter: undefined
            });
        }
        downcastMap.set(castTo, table);
        return table;
    }

    private _getUpcastMap(): Map<Entity, AbstractEntityTable> {
        let upcastMap = this._upcastMap;
        if (upcastMap == null) {
            this._upcastMap = upcastMap = new Map();
        }
        return upcastMap;
    }

    private _getDowncastMap(): Map<Entity, AbstractEntityTable> {
        let downcastMap = this._sharedData.downcastMap;
        if (downcastMap == null) {
            this._sharedData.downcastMap = downcastMap = new Map();
        }
        return downcastMap;
    }

    get __shadow(): TypedBaseTable | undefined {
        return this._sharedData.shadow;
    }

    __forShadow(shadow: TypedBaseTable): AbstractEntityTable {
        if (this._sharedData.shadow === shadow) {
            return this;
        }
        if (shadow.__baseModel !== this.__anchor?.baseModel) {
            throw new StateError(
                "Failed to create a clone table for the shadow, " + 
                "because the model of the shadow anchor in the current table " + 
                "differs from the model of the actual shadow"
            );
        }
        const cloned = Object.assign(Object.create(Object.getPrototypeOf(this)), this) as AbstractEntityTable;
        cloned._sharedData.shadow = shadow;
        cloned._sharedData.nullable = shadow.__isNullable;
        return cloned;
    }

    get __baseModel(): BaseModelImplementor<any> | undefined {
        return undefined;
    }

    get __associationEntity(): AssociationEntity | undefined {
        return undefined;
    }

    get __args(): BaseQuerySelectMapArgs | undefined {
        return undefined;
    }

    get __isCte(): boolean {
        return false;
    }

    get __isPrev(): boolean {
        return false;
    }

    get __isNullable(): boolean {
        return this._sharedData.nullable;
    }

    __inverseAssociatedKey(
        parentModel: AnyModel,
        toThisPropName: string
    ): AbstractExpr<any> | ExprTuple<ExpressionLike[]> {
        const parentEntity = Entity.of(parentModel);
        const prop = parentEntity.prop(toThisPropName);
        this._validateToThisProp(prop);
        const keyProp = prop.thisKeyProp ?? prop.declaringEntity.idProp;
        let exprOrEmbedded: any;
        if (prop.storageType === "MIDDLE_TABLE") {
            const association = this._inverseAssociation(parentModel, toThisPropName);
            const name = `target${capitalize(keyProp.name)}`;
            exprOrEmbedded = 
                keyProp.props != null
                    ? (association as any)[name]()
                    : (association as any)[name];
        } else {
            let backTable: AbstractEntityTable;
            if (prop.mappedByProp != null) {
                backTable = parentEntity.table({
                    parent: this,
                    joinType: "INNER",
                    joinProp: prop.mappedByProp,
                    isJoinPropInverse: false,
                    isTargetFilterIgnored: true,
                    castToEntity: undefined,
                    weakJoinModel: undefined,
                    filter: undefined
                });
            } else {
                backTable = parentEntity.table({
                    parent: this,
                    joinType: "INNER",
                    joinProp: prop,
                    isJoinPropInverse: true,
                    isTargetFilterIgnored: true,
                    castToEntity: undefined,
                    weakJoinModel: undefined,
                    filter: undefined
                });
            }
            exprOrEmbedded = 
                keyProp.props != null
                    ? (backTable as any)[keyProp.name]()
                    : (backTable as any)[keyProp.name];
        }
        if (keyProp.flattenScalarProps.size === 0) {
            return exprOrEmbedded as AbstractExpr<any>;
        }
        const expressions = Array<AbstractExpr<any>>();
        for (const key of keyProp.flattenScalarProps.keys()) {
            let prev = exprOrEmbedded;
            const parts = key.split('.');
            const size = parts.length;
            for (let i = 0; i < size; i++) {
                if (i + 1 == size) {
                    prev = prev[parts[i]!];
                } else {
                    prev = prev[parts[i]!]();
                }
            }
            expressions.push(prev as AbstractExpr<any>);
        }
        if (expressions.length === 1) {
            return expressions[0]!;
        }
        return new ExprTupleImpl(expressions);
    }

    private _validateToThisProp(
        prop: EntityProp
    ) {
        if (prop.targetEntity == null) {
            throw new ArgumentError(`The property "${prop.toString()}" is not association entity`);
        }
        if (prop.targetEntity != this.__entity 
            && this.__entity.ancestors.has(prop.targetEntity)) {
            throw new ArgumentError(
                `The target table of "${
                    this.__entity.name
                }" is not the target of "${prop.toString()}"`
            );
        }
    }
}

export type JoinOperation = {
    readonly parent: AbstractTable;
    readonly joinType: JoinType;
    readonly joinProp: JoinProp | undefined;
    readonly isJoinPropInverse: boolean;
    readonly isTargetFilterIgnored: boolean;
    readonly castToEntity: Entity | undefined;
    readonly weakJoinModel: ModelContract | undefined;
    readonly filter: JoinFilter | undefined;
};

export type JoinProp = EntityProp | AssociationProp;

interface SharedData {

    shadow: TypedBaseTable | undefined;

    nullable: boolean;

    downcastMap: Map<Entity, AbstractEntityTable> | undefined;
}

export type JoinFilter = (
    ctx: JoinFilterContext
) => Predicate | undefined;

export type JoinFilterContext = {
    readonly source: AbstractTable, 
    readonly target: AbstractTable
};

export type EntityTableCtor = new(
    entity: Entity,
    joinOperation: JoinOperation | ShadowAnchor | AbstractEntityTable | undefined
) => AbstractEntityTable;

export function createEntityTableClass(
    entity: Entity
) : EntityTableCtor {

    const superClass = 
        entity.superEntity != null 
            ? entity.superEntity.tableClass()
            : AbstractEntityTable;
    
    const writer = new CodeWriter();
    writer
        .code("return class ThisClass extends $baseClass ")
        .scope("CURLY_BRACKETS", () => {
            writeConstructor(writer);
            for (const prop of entity.declaredPropMap.values()) {
                writeField(prop, writer);
            }
            for (const prop of entity.declaredPropMap.values()) {
                writeProp(prop, writer);
            }
            for (const prop of entity.declaredPropMap.values()) {
                writePropMeta(prop, writer);
            }
        });
    return new Function(
        "$baseClass", "$entity", "$createTableProp", "$makeErr", writer.toString()
    )(
        superClass, entity, createTableProp, makeErr
    );
}

function writeConstructor(writer: CodeWriter) {
    writer
        .code("constructor(entity, options) ")
        .scope("CURLY_BRACKETS", () => {
            writer.code("super(entity, options)").newLine(";");
        })
        .newLine();
}

function writeField(prop: EntityProp, writer: CodeWriter) {
    if (prop.storageType === "MIDDLE_TABLE") {
        return;
    }
    if (prop.associationType != null) {
        writer.code("_").code(prop.name).code(" = undefined").newLine(";");
        writer.code("_").code(prop.name).code("_LEFT = undefined").newLine(";");
    } else if (prop.scalarType != null || prop.props != null) {
        writer.code("_").code(prop.name).code(" = undefined").newLine(";");
    }
}

function writeProp(prop: EntityProp, writer: CodeWriter) {
    if (prop.scalarType != null) {
        writeScalarProp(prop, writer);
    } else if (prop.associationType != null) {
        writeAssociationProp(prop, writer);
    } else if (prop.props != null) {
        writeEmbeddedProp(prop, writer);
    }
}

function writeScalarProp(prop: EntityProp, writer: CodeWriter) {
    writer.code("get ").code(prop.name).code("() ");
    writer.scope("CURLY_BRACKETS", () => {
        writer.code("let expr = this._").code(prop.name).newLine(";");
        writer.code("if (expr == null) ").scope("CURLY_BRACKETS", () => {
            writer
                .code("this._")
                .code(prop.name)
                .code(" = expr = $createTableProp(")
                .code(prop.parentProp == null ? "this" : "self")
                .code(", ThisClass.__");
            writePropPath(prop, "_", writer);
            writer.code(")").newLine(";");
        }).newLine();
        writer.code("return expr").newLine(";");
    }).newLine();
}

function writeAssociationProp(prop: EntityProp, writer: CodeWriter) {
    writer.code(prop.name).code("(options) ");
    writer.scope("CURLY_BRACKETS", () => {
        writer.code(`const joinType = options == null ? "INNER" : `);
        writer.scope({kind: "PARENTHESES", multiline: true}, () => {
            writer.code(`typeof options === "string" ? options : options.joinType ?? "INNER"`);
        }).newLine(";");
        writer.code(`const filter = options?.filter`).newLine(";");
        if (prop.storageType === "MIDDLE_TABLE") {
            writer
                .code(`return this.association("`)
                .code(prop.name)
                .code(`", joinType).target(filter)`)
                .newLine(";");
        } else {
            writer.code(`if (filter == null && joinType === "INNER") `).scope("CURLY_BRACKETS", () => {
                writeNoFilterJoin(prop, false, writer);
            }).newLine();
            writer.code(`if (filter == null && joinType === "LEFT") `).scope("CURLY_BRACKETS", () => {
                writeNoFilterJoin(prop, true, writer);
            }).newLine();
            writer.code("return ");
            writeJoinTable(prop, true, writer);
            writer.newLine(";");
        }
    }).newLine();
}

function writeNoFilterJoin(
    prop: EntityProp,
    left: boolean,
    writer: CodeWriter
) {
    writer
        .code("let join = this._")
        .code(prop.name)
        .codeIf("_LEFT", left)
        .newLine(";");
    writer.code("if (join == null) ").scope("CURLY_BRACKETS", () => {
        writer
            .code("this._")
            .code(prop.name)
            .codeIf("_LEFT", left)
            .code(" = join = ")
        writeJoinTable(prop, false, writer);
        writer.newLine(";");
    }).newLine();
    writer.code("return join").newLine(";");
}

function writeJoinTable(
    prop: EntityProp,
    useFilter: boolean, 
    writer: CodeWriter
) {
    writer.code("ThisClass.__")
            .code(prop.name)
            .code(".targetEntity.table");
    writer.scope("PARENTHESES", () => {
        writer.scope("CURLY_BRACKETS", () => {
            writer
                .code("parent: this")
                .separator()
                .code("joinType")
                .separator()
                .code("joinProp: ThisClass.__").code(prop.name);
            if (prop.mappedByProp != null && prop.storageType != "MIDDLE_TABLE") {
                writer.code(".mappedByProp").separator().code("isJoinPropInverse: true");
            }
            writer.separator();
            if (useFilter) {
                writer.code("filter");
            } else {
                writer.code("filter: undefined");
            }
        });
    });
}

function writeEmbeddedProp(prop: EntityProp, writer: CodeWriter) {
    writer.code(prop.name).code("() ").scope("CURLY_BRACKETS", () => {
        if (prop.parentProp == null) {
            writer.code("const self = this").newLine(";");
        }
        writer.code("let embedded = this._").code(prop.name).newLine(";");
        writer.code("if (embedded == null) ").scope("CURLY_BRACKETS", () => {
            writer.code("this._").code(prop.name).code(" = embedded = new class ");
            writer.scope("CURLY_BRACKETS", () => {
                for (const subProp of prop.props!.values()) {
                    writer.code("_").code(subProp.name).code(" = undefined").newLine(";");
                }
                for (const subProp of prop.props!.values()) {
                    writeProp(subProp, writer);
                }
            }).code(";");
        }).newLine();
        writer.code("return embedded").newLine(";");
    }).newLine();
}

function writePropMeta(prop: EntityProp, writer: CodeWriter) {
    if (prop.props != null) {
        for (const subProp of prop.props.values()) {
            writePropMeta(subProp, writer);
        }
        return;
    }
    if (prop.storageType === "MIDDLE_TABLE") {
        return;
    }
    if (prop.targetEntity == null && prop.scalarType == null) {
        return;
    }
    writer.code("static __");
    writePropPath(prop, "_", writer);
    writer.code(" = $entity.expandedPropMap.get(\"");
    writePropPath(prop, ".", writer);
    writer.code(`")`
    ).newLine(";");
}

function writePropPath(prop: EntityProp, separator: string, writer: CodeWriter) {
    if (prop.parentProp == null) {
        writer.code(prop.name);
    } else {
        writePropPath(prop.parentProp, separator, writer);
        writer.code(separator);
        writer.code(prop.name);
    }
}

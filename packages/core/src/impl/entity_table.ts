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
import { BaseQuerySelectMapArgs } from "@/dsl";
import { BaseModelImplementor } from "./base_query_implementor";
import { AnyModel } from "@/schema/model";
import { AbstractPred, ConstantPred } from "./ast/pred";
import { IsPred } from "./ast/is_pred";
import { AssociationEntity, AssociationProp } from "./association_entity";

export abstract class AbstractEntityTable implements AbstractTable {

    readonly __prototype: AbstractEntityTable;

    readonly __joinOperation: JoinOperation | undefined;

    readonly __anchor: ShadowAnchor | undefined;

    private readonly _sharedData: SharedData;

    private readonly _downcast: boolean;

    private _upcastMap: Map<Entity, AbstractEntityTable> | undefined = undefined;

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

    $acceptRisk(): this {
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
}

export type JoinOperation = {
    readonly parent: AbstractTable;
    readonly joinType: JoinType;
    readonly joinProp: JoinProp | undefined;
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
        writer.code(`if (filter == null && joinType === "INNER") `).scope("CURLY_BRACKETS", () => {
            writeNoFilterJoin(prop, false, writer);
        }).newLine();
        writer.code(`if (filter == null && joinType === "LEFT") `).scope("CURLY_BRACKETS", () => {
            writeNoFilterJoin(prop, true, writer);
        }).newLine();
        writer.code("return ");
        writeJoinTable(prop, true, writer);
        writer.newLine(";")
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
                .code("joinProp: ThisClass.__").code(prop.name)
                .separator();
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

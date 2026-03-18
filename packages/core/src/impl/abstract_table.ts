import { Entity } from "./entity";
import { BaseModelImplementor } from "./base_query_implementor";
import { createTypedBaseTable, TypedBaseTable } from "./base_table";
import { BaseQuerySelectMapArgs, JoinType, ModelLike } from "@/dsl";
import { JoinFilter, JoinOperation } from "./entity_table";
import { ModelImpl } from "./model_impl";
import { AnyModel } from "@/schema/model";
import { ModelContract } from "./model_contract";
import { ShadowAnchor } from "./shadow_anchor";

export interface AbstractTable {

    readonly __entity: Entity | undefined;

    readonly __baseModel: BaseModelImplementor<any> | undefined;

    readonly __joinOperation: JoinOperation | undefined;

    readonly __anchor: ShadowAnchor | undefined;

    readonly __shadow: TypedBaseTable | undefined;

    readonly __args: BaseQuerySelectMapArgs | undefined;

    readonly __isCte: boolean;

    readonly __isPrev: boolean;

    readonly __isNullable: boolean;

    readonly __prototype: AbstractTable;

    join(
        model: ModelLike,
        options: JoinFilter | {
            readonly joinType?: JoinType,
            readonly filter: JoinFilter
        }
    ): AbstractTable;
}

export function createJoinedTable(
    parent: AbstractTable,
    model: ModelLike,
    options: JoinFilter | {
        readonly joinType?: JoinType,
        readonly filter: JoinFilter
    }
): AbstractTable {
    const joinType = typeof options === "function" ? "INNER" : options.joinType ?? "INNER";
    const filter = typeof options === "function" ? options : options.filter;
    if (model instanceof ModelImpl) {
        return Entity.of(model as AnyModel).table({
            parent, 
            joinType, 
            joinProp: undefined, 
            castToEntity: undefined,
            weakJoinModel: model as any as ModelContract,
            filter
        });
    }
    return createTypedBaseTable(model as BaseModelImplementor<any>, {
        parent,
        joinType,
        joinProp: undefined,
        castToEntity: undefined,
        weakJoinModel: model as any as ModelContract,
        filter
    });
}

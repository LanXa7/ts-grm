import { Entity } from "./entity";
import { BaseModelImplementor } from "./base_query_implementor";
import { createTypedBaseTable, TypedBaseTable } from "./base_table";
import { BaseQuerySelectMapArgs } from "@/dsl/base_query";
import { JoinFilter, JoinOperation } from "./entity_table";
import { ModelImpl } from "./model_impl";
import { AnyModel } from "@/schema/model";
import { ModelContract } from "./model_contract";
import { ShadowAnchor } from "./shadow_anchor";
import { AssociationEntity } from "./association_entity";
import { AssociationModelImpl } from "./association_model_impl";
import { ModelLike } from "@/dsl/table_internal_types";
import { JoinType } from "@/dsl/table";

export interface AbstractTable {

    readonly __entity: Entity | undefined;

    readonly __baseModel: BaseModelImplementor<any> | undefined;

    readonly __associationEntity: AssociationEntity | undefined;

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
    options: JoinType | JoinFilter | {
        readonly joinType?: JoinType,
        readonly filter?: JoinFilter
    } | undefined
): AbstractTable {
    const joinType = typeof options === "string" 
        ? options as JoinType
        : typeof options === "function" ? "INNER" : options?.joinType ?? "INNER";
    const filter = typeof options === "string"
        ? undefined 
        : typeof options === "function" ? options : options?.filter;
    if (model instanceof ModelImpl) {
        return Entity.of(model as AnyModel).table({
            parent, 
            joinType, 
            joinProp: undefined, 
            isJoinPropInverse: false,
            isTargetFilterIgnored: false,
            castToEntity: undefined,
            weakJoinModel: model as any as ModelContract,
            filter
        });
    }
    if (model instanceof AssociationModelImpl) {
        return model.toEntity().table({
            parent, 
            joinType, 
            joinProp: undefined, 
            isJoinPropInverse: false,
            isTargetFilterIgnored: false,
            castToEntity: undefined,
            weakJoinModel: model as any as ModelContract,
            filter
        });
    }
    return createTypedBaseTable(model as BaseModelImplementor<any>, {
        parent,
        joinType,
        joinProp: undefined,
        isJoinPropInverse: false,
        isTargetFilterIgnored: false,
        castToEntity: undefined,
        weakJoinModel: model as any as ModelContract,
        filter
    });
}

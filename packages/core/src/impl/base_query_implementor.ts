import { BaseModel, BaseQuery } from "@/dsl/base_query";
import { BaseQueryMapOf, BaseQueryProjection, BaseQuerySelectMapArgs } from "@/dsl/base_query";
import { ModelContract } from "./model_contract";

export interface BaseQueryImplementor<TProjection> extends BaseQuery<TProjection> {

    toModel(
        isCte: boolean
    ): BaseModelImplementor<BaseQueryMapOf<TProjection>>;
}

export interface BaseModelImplementor<T extends BaseQuerySelectMapArgs> extends BaseModel<T>, ModelContract {

    readonly __args: T;

    readonly __isCte: boolean;

    readonly __isRecursive: boolean;

    __toQuery(): BaseQueryImplementor<BaseQueryProjection<T>>;
}
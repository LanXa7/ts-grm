import { BaseModel, BaseQuery } from "@/dsl";
import { BaseQueryMapOf, BaseQueryProjection, BaseQuerySelectMapArgs } from "@/dsl/base_query";

export interface BaseQueryImplementor<TProjction> extends BaseQuery<TProjction> {

    toModel(
        isCte: boolean
    ): BaseModelImplementor<BaseQueryMapOf<TProjction>>;
}

export interface BaseModelImplementor<T extends BaseQuerySelectMapArgs> extends BaseModel<T> {

    readonly __args: T;

    readonly __isCte: boolean;

    readonly __isRecursive: boolean;

    __toQuery(): BaseQueryImplementor<BaseQueryProjection<T>>;
}
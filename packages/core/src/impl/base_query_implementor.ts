import { BaseModel, BaseQuery } from "@/dsl";
import { BaseQueryMapOf, BaseQueryProjection, BaseQuerySelectMapArgs } from "@/dsl/base-query";

export interface BaseQueryImplementor<TProjction> extends BaseQuery<TProjction> {

    toModel(
        isCte: boolean
    ): BaseModelImplementor<BaseQueryMapOf<TProjction>>;
}

export interface BaseModelImplementor<T extends BaseQuerySelectMapArgs> extends BaseModel<T> {

    readonly __args: T;

    readonly __isCte: boolean;

    toQuery(): BaseQueryImplementor<BaseQueryProjection<T>>;
}
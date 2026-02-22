import { AnyModel } from "@/schema/model";
import { ExpressionLike, Predicate } from "./expression";
import { BaseTable, Table, TableLike } from "./table";
import { AtLeastOne, ExpressionOrder } from "./utils";
import { getQueryFactory } from "@/impl/ast/query_factory";
import { BaseQueryImplementor } from "@/impl/base_query_implementor";

export function derivedModel<TQuery extends BaseQuery<any>>(
    query: TQuery,
) : BaseModel<BaseQueryMapOf<TQuery>> {
    return (query as any as BaseQueryImplementor<any>).toModel(false) as 
        BaseModel<BaseQueryMapOf<TQuery>>;
}

export function cteModel<TQuery extends BaseQuery<any>>(
    query: TQuery,
) : BaseModel<BaseQueryMapOf<TQuery>> {
    return (query as any as BaseQueryImplementor<any>).toModel(true) as 
        BaseModel<BaseQueryMapOf<TQuery>>;
}

export function baseQuery<
    const TModels extends AtLeastOne<AnyModel | BaseModel<any>>,
    TProjection extends BaseQueryProjection<any>
>(
    ...args: [
        ...models: TModels,
        fn: (
            q: MutableBaseQuery,
            ...tables: {
                [K in keyof TModels]: Table<TModels[K]>
            } extends infer T ? T extends any[] ? T : never : never
        ) => TProjection
    ]
): BaseQuery<TProjection> {
    return getQueryFactory().createBaseQuery(...args);
}

export interface MutableBaseQuery {

    __type(): { mutableBaseQuery: true };

    where(
        ...predicates: ReadonlyArray<Predicate | null | undefined>
    ): this;

    orderBy(
        ...orders: ReadonlyArray<ExpressionLike | ExpressionOrder>
    ): this;

    groupBy(
        ...expressions: ReadonlyArray<ExpressionLike>
    ): this;

    having(
        ...predicates: ReadonlyArray<Predicate | null | undefined>
    ): this;

    select<
        const TSelectionMap extends BaseQuerySelectMapArgs
    >(
        selectionMap: TSelectionMap
    ): BaseQueryProjection<TSelectionMap>;
}

export interface RecursiveMutableBaseQuery<TProjection> 
extends MutableBaseQuery {
    
    __type(): { 
        mutableBaseQuery: true 
        recursiveBaseQuery: TProjection
    };

    readonly prev: BaseTable<BaseQueryMapOf<TProjection>>;
}

export interface BaseQuery<TProjection> {

    __type(): { baseQuery: TProjection | true; };

    limit(limit: number): BaseQuery<TProjection>;

    offset(offset: number): BaseQuery<TProjection>;

    unionAllRecursively<
        const TModels extends AtLeastOne<AnyModel | BaseModel<any>>
    >(
        ...args: [
            ...models: TModels,
            fn: (
                q: RecursiveMutableBaseQuery<TProjection>,
                ...tables: {
                    [K in keyof TModels]: Table<TModels[K]>
                } extends infer T ? T extends any[] ? T : never : never
            ) => TProjection
        ]
    ): BaseQuery<TProjection>;
}

export type BaseQueryProjection<TSelections extends BaseQuerySelectMapArgs> = {

    __type(): { baseQueryProjection: TSelections | true };
};

export type BaseQuerySelectMapArgs = {
    readonly [key: string]: ExpressionLike | TableLike;
};

export type BaseQueryMapOf<T> =
    T extends BaseQueryProjection<infer R>
        ? R
    : T extends BaseQuery<infer P>
        ? BaseQueryMapOf<P>
    : never;

export interface BaseModel<
    T extends BaseQuerySelectMapArgs
> {

    __type(): {
        baseModel: T | true
    };
};
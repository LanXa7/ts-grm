import { StateError } from "@/error/common";
import { makeErr } from "@/error/util";
import { 
    AtLeastOne, 
    BaseModel, 
    BaseQuery,
    AtomBaseQuery,
    BaseQueryProjection, 
    Expression, 
    ExpressionSubQuery,
    TupleSubQuery,
    AtomTupleSubQuery,
    AtomExpressionSubQuery, 
    MutableBaseQuery, 
    MutableSubQuery, 
    RootQuery, 
    RootQueryProjection, 
    Table
} from "@/dsl";
import { AnyModel } from "@/schema/model";
import { SubQueryProjection } from "@/dsl/sub_query";

export interface QueryFactory {

    createAtomSubQuery<
        const TModels extends AtLeastOne<AnyModel | BaseModel<any>>,
        TProjection extends SubQueryProjection<any, any> | void
    >(
        ...args: [
            ...models: TModels,
            fn: (
                q: MutableSubQuery,
                ...tables: {
                    [K in keyof TModels]: Table<TModels[K]>
                } extends infer T ? T extends any[] ? T : never : never
            ) => TProjection
        ]
    ): TProjection extends SubQueryProjection<infer T, infer Kind>
        ? Kind extends "EXPRESSION"
            ? AtomExpressionSubQuery<T>
            : AtomTupleSubQuery<T>
        : TProjection extends void
            ? AtomExpressionSubQuery<Expression<number>>
        : never;
        
    createAtomBaseQuery<
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
    ): AtomBaseQuery<TProjection>;

    createMergedRootQuery<TProjection extends RootQueryProjection<any>>(
        kind: MergedQueryKind,
        queries: ReadonlyArray<RootQuery<TProjection>>
    ): RootQuery<TProjection>;

    createMergedExpressionSubQuery<TProjection>(
        kind: MergedQueryKind,
        queries: ReadonlyArray<ExpressionSubQuery<TProjection>>
    ): ExpressionSubQuery<TProjection>;

    createMergedTupleSubQuery<TProjection>(
        kind: MergedQueryKind,
        queries: ReadonlyArray<TupleSubQuery<TProjection>>
    ): TupleSubQuery<TProjection>;

    createMergedBaseQuery<TProjection>(
        kind: MergedQueryKind,
        queries: ReadonlyArray<BaseQuery<TProjection>>
    ): BaseQuery<TProjection>;
}

export type MergedQueryKind = "UNION" | "UNION_ALL" | "MINUS" | "INTERSECT";

let queryFactory: QueryFactory | undefined = undefined;

export function getQueryFactory(): QueryFactory {
    return queryFactory ?? makeErr(`No query factory, please add the dependency "tsgrm-query"`);
}

export function setQueryFactory(qf: QueryFactory) {
    if (queryFactory != null && queryFactory !== qf) {
        throw new StateError(`The query factory cannot be set twice`);
    }
    queryFactory = qf;
}
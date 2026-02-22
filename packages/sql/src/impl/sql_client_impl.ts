import { SqlClientOptions } from "@/cfg";
import { Driver } from "@/driver/deriver";
import { SqlClientImplementor } from "@/sql_client";
import type { 
    Criteria, 
    View, 
    TypeOf, 
    ModelOf, 
    AtLeastOne, 
    AnyModel,
    BaseModel,
    RootQueryProjection,
    RootQuery,
    MutableRootQuery,
    Table,
    BaseQuery,
    MutableBaseQuery,
    MutableSubQuery,
    ExpressionSubQuery,
    TupleSubQuery,
    Expression,
    BaseQueryProjection,
    SubQueryProjection,
    BaseQueryMapOf,
    AtomRootQuery,
    AtomExpressionSubQuery,
    AtomTupleSubQuery,
    AtomBaseQuery
} from "@ts-grm/core";
import { supressUnused, ast } from "@ts-grm/core";
import { MutableRootQueryImpl } from "./mutable_root_query_impl";
import { AtomRootQueryImpl } from "./atom_root_query_impl";
import { AbstractRootQueryProjection, MapBaseQueryProjection } from "./query_projection";
import { AtomBaseQueryImpl } from "./atom_base_query_impl";
import { MutableBaseQueryImpl } from "./mutable_base_query_impl";
import { toTables } from "./utils";
import { MergedBaseQueryImpl, MergedRootQueryImpl } from "./merged_query";

export class SqlClientImpl implements SqlClientImplementor {

    __type(): { sqlClient: undefined } {
        return { sqlClient: undefined }
    }

    constructor(
        readonly driver: Driver,
        readonly options: SqlClientOptions
    ) {}

    findNonNull<V extends View<any, any>>(
        view: V,
        criteria: Criteria<ModelOf<V>>
    ): Promise<TypeOf<V>> {
        supressUnused(view);
        supressUnused(criteria);
        throw new Error();
    }

    createQuery<
        const TModels extends AtLeastOne<AnyModel | BaseModel<any>>,
        TProjection extends RootQueryProjection<any>
    >(
        ...args: [
            ...symbols: TModels,
            fn: (
                q: MutableRootQuery,
                ...tables: {
                    [K in keyof TModels]: Table<TModels[K]>
                } extends infer T ? T extends any[] ? T : never : never
            ) => TProjection
        ]
    ): AtomRootQuery<TProjection> {
        const tables = toTables(args);
        const mutableQuery = new MutableRootQueryImpl(this, tables);
        const fnArgs: Array<any> = [ mutableQuery, ...tables ];
        const fn = args[args.length - 1] as Function;
        const projection = fn.apply(undefined, fnArgs) as AbstractRootQueryProjection<any>;
        return new AtomRootQueryImpl<TProjection>(mutableQuery, projection, undefined);
    }
}

class QueryFactoryImpl implements ast.QueryFactory {
    
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
        : never {
        supressUnused(args);
        throw new Error();
    }
        
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
    ): AtomBaseQuery<TProjection> {
        const tables = toTables(args);
        const mutableQuery = new MutableBaseQueryImpl(tables);
        const fnArgs: Array<any> = [ mutableQuery, ...tables ];
        const fn = args[args.length - 1] as Function;
        const projection = fn.apply(undefined, fnArgs) as MapBaseQueryProjection<BaseQueryMapOf<TProjection>>;
        return new AtomBaseQueryImpl(mutableQuery, projection, undefined);
    }

    createMergedRootQuery<TProjection extends RootQueryProjection<any>>(
        kind: ast.MergedQueryKind, 
        queries: ReadonlyArray<RootQuery<TProjection>>
    ): RootQuery<TProjection> {
        return new MergedRootQueryImpl(kind, queries as any);
    }

    createMergedExpressionSubQuery<TProjection>(
        kind: ast.MergedQueryKind, 
        queries: ReadonlyArray<ExpressionSubQuery<TProjection>>
    ): ExpressionSubQuery<TProjection> {
        supressUnused(kind);
        supressUnused(queries);
        throw new Error(); 
    }

    createMergedTupleSubQuery<TProjection>(
        kind: ast.MergedQueryKind, 
        queries: ReadonlyArray<TupleSubQuery<TProjection>>
    ): TupleSubQuery<TProjection> {
        supressUnused(kind);
        supressUnused(queries);
        throw new Error(); 
    }

    createMergedBaseQuery<TProjection>(
        kind: ast.MergedQueryKind, 
        queries: ReadonlyArray<BaseQuery<TProjection>>
    ): BaseQuery<TProjection> {
        return new MergedBaseQueryImpl(kind, queries as any);
    }
}

const queryFactory = new QueryFactoryImpl();

ast.setQueryFactory(queryFactory);
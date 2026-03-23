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
    AtomBaseQuery,
    metadata,
    AnyAssociationModel
} from "@ts-grm/core";
import { suppressUnused, ast } from "@ts-grm/core";
import { MutableRootQueryImpl } from "./mutable_root_query_impl";
import { AtomRootQueryImpl } from "./atom_root_query_impl";
import { AbstractRootQueryProjection, AbstractSubQueryProjection, ExpressionSubQueryProjection, MapBaseQueryProjection } from "./query_projection";
import { AtomBaseQueryImpl } from "./atom_base_query_impl";
import { MutableBaseQueryImpl } from "./mutable_base_query_impl";
import { toTables } from "./utils";
import { MergedBaseQueryImpl, MergedDtSubQueryImpl, MergedExprSubQueryImpl, MergedNumSubQueryImpl, MergedRootQueryImpl, MergedStrSubQueryImpl, MergedTupleSubQueryImpl } from "./merged_query";
import { MutableSubQueryImpl } from "./mutable_sub_query_impl";
import { AtomDtSubQueryImpl, AtomNumSubQueryImpl, AtomStrSubQueryImpl, AtomExprSubQueryImpl, AtomTupleSubQueryImpl } from "./atom_sub_query_impl";

export class SqlClientImpl implements SqlClientImplementor {

    __type(): { sqlClient: undefined } {
        return { sqlClient: undefined }
    }

    private readonly _strategy: metadata.DatabaseNamingStrategy;

    constructor(
        readonly driver: Driver,
        readonly options: SqlClientOptions
    ) {
        this._strategy = options.strategy;
    }

    findNonNull<V extends View<any, any>>(
        view: V,
        criteria: Criteria<ModelOf<V>>
    ): Promise<TypeOf<V>> {
        suppressUnused(view);
        suppressUnused(criteria);
        throw new Error();
    }

    createQuery<
        const TModels extends AtLeastOne<AnyModel | BaseModel<any> | AnyAssociationModel>,
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

    isDirectAssociatedKey(
        expr: ast.PropExprContract
    ): boolean {
        const joinProp = expr.table.__joinOperation?.joinProp;
        if (joinProp == null) {
            return false;
        }
        const storage = joinProp.toStorage(this._strategy);
        if (storage == null) {
            return false;
        }
        if (joinProp.targetKey !== expr.prop.rootProp.name) {
            return false;
        }
        return true;
    }
}

class QueryFactoryImpl implements ast.QueryFactory {
    
    createAtomSubQuery<
        const TModels extends AtLeastOne<AnyModel | BaseModel<any> | AnyAssociationModel>,
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
        const tables = toTables(args);
        const mutableQuery = new MutableSubQueryImpl(tables);
        const fnArgs: Array<any> = [ mutableQuery, ...tables ];
        const fn = args[args.length - 1] as Function;
        const projection = fn.apply(undefined, fnArgs) as AbstractSubQueryProjection<TProjection, any>;
        if (projection.kind === "SUB_ARRAY") {
            return new AtomTupleSubQueryImpl(mutableQuery, projection, undefined) as any;
        }
        const selection = (projection as ExpressionSubQueryProjection<any>).selection;
        if (selection instanceof ast.AbstractDtExpr) {
            return new AtomDtSubQueryImpl(mutableQuery, projection, undefined) as any;
        }
        if (selection instanceof ast.AbstractStrExpr) {
            return new AtomStrSubQueryImpl(mutableQuery, projection, undefined) as any;
        }
        if (selection instanceof ast.AbstractNumExpr) {
            return new AtomNumSubQueryImpl(mutableQuery, projection, undefined) as any;
        }
        return new AtomExprSubQueryImpl(mutableQuery, projection, undefined) as any;
    }
        
    createAtomBaseQuery<
        const TModels extends AtLeastOne<AnyModel | BaseModel<any> | AnyAssociationModel>,
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
        return new AtomBaseQueryImpl(mutableQuery, undefined, projection, undefined);
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
        if (queries instanceof ast.AbstractDtExpr) {
            return new MergedDtSubQueryImpl(kind, queries as any) as any;
        }
        if (queries instanceof ast.AbstractStrExpr) {
            return new MergedStrSubQueryImpl(kind, queries as any) as any;
        }
        if (queries instanceof ast.AbstractNumExpr) {
            return new MergedNumSubQueryImpl(kind, queries as any) as any;
        }
        return new MergedExprSubQueryImpl(kind, queries as any) as any;
    }

    createMergedTupleSubQuery<TProjection>(
        kind: ast.MergedQueryKind, 
        queries: ReadonlyArray<TupleSubQuery<TProjection>>
    ): TupleSubQuery<TProjection> {
        return new MergedTupleSubQueryImpl(kind, queries as any) as any;
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
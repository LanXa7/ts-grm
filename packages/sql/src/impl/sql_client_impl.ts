import { AnyFilter, SqlClientOptions } from "@/cfg";
import { Driver } from "@/driver/deriver";
import { SqlClientImplementor } from "@/sql_client";
import { 
    Criteria, 
    View, 
    TypeOf, 
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
    AnyAssociationModel,
    Isolation,
    Propagation,
    TransactionOptions,
    Schema,
    FetchRangeOptions,
    FetchPageOptions,
    Page,
    spi,
    dsl,
    err,
    suppressUnused,
    __ModelOf
} from "@ts-grm/core";
import { MutableRootQueryImpl } from "./mutable_root_query_impl";
import { AtomRootQueryImpl } from "./atom_root_query_impl";
import { AbstractRootQueryProjection, AbstractSubQueryProjection, ExpressionSubQueryProjection, MapBaseQueryProjection } from "./query_projection";
import { AtomBaseQueryImpl } from "./atom_base_query_impl";
import { MutableBaseQueryImpl } from "./mutable_base_query_impl";
import { toTables } from "./utils";
import { MergedBaseQueryImpl, MergedDtSubQueryImpl, MergedExprSubQueryImpl, MergedNumSubQueryImpl, MergedRootQueryImpl, MergedStrSubQueryImpl, MergedTupleSubQueryImpl } from "./merged_query";
import { MutableSubQueryImpl } from "./mutable_sub_query_impl";
import { AtomDtSubQueryImpl, AtomNumSubQueryImpl, AtomStrSubQueryImpl, AtomExprSubQueryImpl, AtomTupleSubQueryImpl } from "./atom_sub_query_impl";
import { TableDef } from "./schema_def";
import { createSchema } from "./schema_creator";
import { Executor } from "@/transaction/executor";

export class SqlClientImpl implements SqlClientImplementor {

    __type(): { sqlClient: undefined } {
        return { sqlClient: undefined }
    }

    private readonly _configuredFilterMap: Map<spi.Entity, ReadonlyArray<AnyFilter>>;

    private readonly _filterMap =
        new Map<spi.Entity, ReadonlyArray<AnyFilter>>();

    readonly strategy: spi.DatabaseStrategy;

    constructor(
        readonly driver: Driver,
        readonly options: SqlClientOptions
    ) {
        this._configuredFilterMap = (options.filterManager as any)._toMap();
        this.strategy = {
            namingStrategy: options.strategy,
            keywordStrategy: driver
        };
    }

    findOne<V extends View<any, any>>(
        view: V,
        criteria: Criteria<__ModelOf<V>>
    ): Promise<TypeOf<V>> {
        suppressUnused(view);
        suppressUnused(criteria);
        throw new Error();
    }

    findOneOrNull<V extends View<any, any>>(
        view: V,
        criteria: Criteria<__ModelOf<V>>
    ): Promise<TypeOf<V>> {
        suppressUnused(view);
        suppressUnused(criteria);
        throw new Error();
    }

    findOneOrUndefined<V extends View<any, any>>(
        view: V,
        criteria: Criteria<__ModelOf<V>>
    ): Promise<TypeOf<V>> {
        suppressUnused(view);
        suppressUnused(criteria);
        throw new Error();
    }

    findMany<V extends View<any, any>>(
        view: V,
        criteria: Criteria<__ModelOf<V>>
    ): Promise<Array<TypeOf<V>>> {
        suppressUnused(view);
        suppressUnused(criteria);
        throw new Error();
    }

    findRange<V extends View<any, any>>(
        view: V,
        criteria: Criteria<__ModelOf<V>>,
        options: FetchRangeOptions
    ): Promise<Array<TypeOf<V>>> {
        suppressUnused(view);
        suppressUnused(criteria);
        suppressUnused(options);
        throw new Error();
    }

    findPage<V extends View<any, any>>(
        view: V,
        criteria: Criteria<__ModelOf<V>>,
        options: FetchPageOptions
    ): Promise<Page<TypeOf<V>>> {
        suppressUnused(view);
        suppressUnused(criteria);
        suppressUnused(options);
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
        const query = new AtomRootQueryImpl<TProjection>(mutableQuery, projection, undefined);
        if (projection.distinct) {
            return query.distinct();
        }
        return query;
    }

    isDirectAssociatedKey(
        expr: spi.PropExprContract
    ): boolean {
        const joinProp = expr.table.__joinOperation?.joinProp;
        if (joinProp == null || expr.table.__joinOperation!.isJoinPropInverse) {
            return false;
        }
        if (joinProp.targetKeyProp !== expr.prop.rootProp) {
            return false;
        }
        if (expr.table.__joinOperation!.isTargetFilterIgnored) {
            return true;
        }
        if (expr.table.__entity != null && this.getFilters(expr.table.__entity).length != 0) {
            return false;
        }
        return true;
    }

    getFilters(
        entity: spi.Entity
    ): ReadonlyArray<AnyFilter> {
        let filters = this._filterMap.get(entity);
        if (filters == null) {
            filters = this._createFilters(entity);
            this._filterMap.set(entity, filters);
        }
        return filters;
    }

    private _createFilters(
        entity: spi.Entity
    ): ReadonlyArray<AnyFilter> {
        const filters: Array<AnyFilter> = [];
        for (let e: spi.Entity | undefined = entity; 
            e != null; 
            e = e.superEntity) {
            const arr = this._configuredFilterMap?.get(e);
            if (arr != null) {
                filters.push(...arr);
            }
        }
        return filters;
    }

    execute<R>(
        options: Propagation | Isolation | number | Partial<TransactionOptions> | (() => Promise<R>),
        fn?: () => Promise<R>
    ): Promise<R> {
        let propagation: Propagation = "REQUIRED";
        let isolation: Isolation = "READ_COMMITTED";
        let timeout = 0;
        let func: () => Promise<R>;
        if (typeof options === "function") {
            func = options;
        } else {
            func = fn!; 
            if (typeof options === "string") {
                switch (options) {
                    case "READ_UNCOMMITTED":
                    case "READ_COMMITTED":
                    case "REPEATABLE_READ":
                    case "SERIALIZABLE":
                        isolation = options;
                        break;
                    default:
                        propagation = options;
                }
            } else {
                if (typeof options === "number") {
                    timeout = options;
                } else {
                    if (options.propagation != null) {
                        propagation = options.propagation;
                    }
                    if (options.isolation != null) {
                        isolation = options.isolation;
                    }
                    if (options.timeout != null) {
                        timeout = options.timeout;
                    }
                }
                if (timeout < 0) {
                    throw new err.ArgumentError(`The argument cannot be negative number, but it is ${timeout}`);
                }
            }
        }
        return this.driver.transactionManager.execute({propagation, isolation, timeout}, func);
    }

    async createSchema(): Promise<Schema> {
        const tableDefs = await createSchema(this);
        return new SchemaImpl(this, tableDefs);
    }

    get executor(): Executor {
        return this.options.executorCreator(this.driver.transactionManager.defaultExecutor);
    }
}

class QueryFactoryImpl implements spi.QueryFactory {
    
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
        if (projection == null) {
            return new AtomNumSubQueryImpl(
                mutableQuery, 
                new ExpressionSubQueryProjection(dsl.constant(1) as Expression<any>, false), 
                undefined
            ) as any;
        }
        let query: any;
        if (projection.kind === "SUB_ARRAY") {
            query = new AtomTupleSubQueryImpl(mutableQuery, projection, undefined) as any;
        } else {
            const selection = (projection as ExpressionSubQueryProjection<any>).selection;
            if (selection instanceof spi.AbstractDtExpr) {
                query = new AtomDtSubQueryImpl(mutableQuery, projection, undefined) as any;
            } else if (selection instanceof spi.AbstractStrExpr) {
                query = new AtomStrSubQueryImpl(mutableQuery, projection, undefined) as any;
            } else if (selection instanceof spi.AbstractNumExpr) {
                query = new AtomNumSubQueryImpl(mutableQuery, projection, undefined) as any;
            } else {
                query = new AtomExprSubQueryImpl(mutableQuery, projection, undefined) as any;
            }
        }
        if (projection.distinct) {
            return query.distinct();
        }
        return query;
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
        const query = new AtomBaseQueryImpl(mutableQuery, undefined, projection, undefined);
        if (projection.distinct) {
            return query.distinct();
        }
        return query;
    }

    createMergedRootQuery<TProjection extends RootQueryProjection<any>>(
        kind: spi.MergedQueryKind, 
        queries: ReadonlyArray<RootQuery<TProjection>>
    ): RootQuery<TProjection> {
        return new MergedRootQueryImpl(kind, queries as any);
    }

    createMergedExpressionSubQuery<TProjection>(
        kind: spi.MergedQueryKind, 
        queries: ReadonlyArray<ExpressionSubQuery<TProjection>>
    ): ExpressionSubQuery<TProjection> {
        if (queries instanceof spi.AbstractDtExpr) {
            return new MergedDtSubQueryImpl(kind, queries as any) as any;
        }
        if (queries instanceof spi.AbstractStrExpr) {
            return new MergedStrSubQueryImpl(kind, queries as any) as any;
        }
        if (queries instanceof spi.AbstractNumExpr) {
            return new MergedNumSubQueryImpl(kind, queries as any) as any;
        }
        return new MergedExprSubQueryImpl(kind, queries as any) as any;
    }

    createMergedTupleSubQuery<TProjection>(
        kind: spi.MergedQueryKind, 
        queries: ReadonlyArray<TupleSubQuery<TProjection>>
    ): TupleSubQuery<TProjection> {
        return new MergedTupleSubQueryImpl(kind, queries as any) as any;
    }

    createMergedBaseQuery<TProjection>(
        kind: spi.MergedQueryKind, 
        queries: ReadonlyArray<BaseQuery<TProjection>>
    ): BaseQuery<TProjection> {
        return new MergedBaseQueryImpl(kind, queries as any);
    }
}

const queryFactory = new QueryFactoryImpl();

spi.setQueryFactory(queryFactory);

class SchemaImpl implements Schema {

    private _sqlArray: ReadonlyArray<string> | undefined = undefined;

    private _str: string | undefined = undefined;

    constructor(
        readonly sqlClient: SqlClientImplementor,
        readonly tableDefs: ReadonlyArray<TableDef>
    ) {}

    get sqlArray(): ReadonlyArray<string> {
        let arr = this._sqlArray;
        if (arr == null) {
            this._sqlArray = arr = this._toSqlArray();
        }
        return arr;
    }
    
    private _toSqlArray(): ReadonlyArray<string> {
        const arr: Array<string> = [];
        for (const tableDef of this.tableDefs) {
            const sqlArr = tableDef.toStatements(this.sqlClient.driver);
            arr.push(...sqlArr);
        }
        return arr;     
    }

    execute(): Promise<void> {
        return this.sqlClient.driver.transactionManager.executeReadonly(async () => {
            for (const sql of this.sqlArray) {
                await this.sqlClient.executor.execute(sql);
            }
        });
    }

    toString(): string {
        let str = this._str;
        if (str == null) {
            const arr: Array<string> = [...this.sqlArray, ""];
            this._str = str = arr.join(";\n\n");
        }
        return str;
    }
}
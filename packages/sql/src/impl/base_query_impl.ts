import { 
    AnyModel, 
    ast, 
    AtLeastOne, 
    BaseModel, 
    BaseQuery, 
    BaseQueryMapOf, 
    BaseQueryProjection, 
    BaseQuerySelectMapArgs, 
    BaseTable, 
    dsl, 
    ExpressionOrder, 
    metadata, 
    RecursiveMutableBaseQuery, 
    Table 
} from "@ts-grm/core";
import { MutableBaseQueryImpl } from "./mutable_base_query_impl";
import { toTables } from "./utils";
import { RecursiveMutableBaseQueryImpl } from "./recursive_mutable_base_query_impl";
import { MapBaseQueryProjection } from "./query_projection";

export class BaseQueryImpl<TProjection> 
implements metadata.BaseQueryImplementor<TProjection>, ast.AtomQueryContract {

    readonly options: ast.AtomQueryOptions;

    constructor(
        private readonly mutableQuery: MutableBaseQueryImpl,
        readonly args: BaseQueryMapOf<TProjection>,
        options: ast.AtomQueryOptions | undefined
    ) {
        this.options = options ?? ast.defaultAtomQueryOptions;
    }

    __type(): { baseQuery: TProjection | true; } {
        return { baseQuery: true };
    }

    distinct(): BaseQuery<TProjection> {
        return new BaseQueryImpl(
            this.mutableQuery,
            this.args,
            {...this.options, distinct: true }
        );
    }

    limit(limit: number): BaseQuery<TProjection> {
        return new BaseQueryImpl(
            this.mutableQuery,
            this.args,
            {...this.options, limit }
        );
    }

    offset(offset: number): BaseQuery<TProjection> {
        return new BaseQueryImpl(
            this.mutableQuery,
            this.args,
            {...this.options, offset }
        );
    }

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
    ): BaseQuery<TProjection> {
        const prev = metadata.createTypedBaseTable(this.toModel(true)) as BaseTable<BaseQueryMapOf<TProjection>>;
        const tables = toTables(args);
        const mutableQuery = new RecursiveMutableBaseQueryImpl<TProjection>(prev, tables);
        const fnArgs = [ mutableQuery, ...tables ];
        const fn = args[args.length - 1] as Function;
        const projection = fn.apply(undefined, fnArgs) as MapBaseQueryProjection<BaseQueryMapOf<TProjection>>;
        const newQuery = new BaseQueryImpl(mutableQuery, projection.args, undefined);
        return dsl.unionAll(this, newQuery);
    }

    toModel(
        isCte: boolean
    ): metadata.BaseModelImplementor<BaseQueryMapOf<TProjection>> {
        return new BaseModelImpl(this as any, isCte);
    }

    get kind(): "ATOM" {
        return "ATOM";
    }

    get tables(): ReadonlyArray<metadata.AbstractTable> {
        return this.mutableQuery.tables;
    }
    
    get wherePred(): ast.AbstractPred | undefined {
        return this.mutableQuery.wherePred;
    }
    
    get orders(): ReadonlyArray<ExpressionOrder> {
        return this.mutableQuery.orders;
    }
    
    get groupByExprs(): ReadonlyArray<ast.AbstractExpr<any>> | undefined {
        return this.mutableQuery.groupByExprs;
    }
    
    get havingPred(): ast.AbstractPred | undefined {
        return this.mutableQuery.havingPred;
    }

    get projection(): ast.ProjectionContract {
        return this.args as any as ast.ProjectionContract;
    }

    accept(visitor: ast.Visitor): void {
        visitor.visitAtomQuery(this);
    }
}

export class BaseModelImpl<T extends BaseQuerySelectMapArgs> implements metadata.BaseModelImplementor<T> {

    __type(): {
        baseModel: T | true;
    } {
        return { baseModel: true };
    }

    constructor(
        private readonly _query: BaseQueryImpl<BaseQueryProjection<T>>,
        readonly __isCte: boolean,
    ) {}

    get __args(): T {
        return this._query.args;
    }

    toQuery(): metadata.BaseQueryImplementor<BaseQueryProjection<T>> {
        return this._query;
    }
}
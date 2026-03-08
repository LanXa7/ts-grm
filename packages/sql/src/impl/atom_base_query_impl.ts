import { 
    ast, 
    AtomBaseQuery, 
    BaseQuery, 
    BaseQueryMapOf, 
    ExpressionOrder, 
    metadata, 
} from "@ts-grm/core";
import { MutableBaseQueryImpl } from "./mutable_base_query_impl";
import { MapBaseQueryProjection } from "./query_projection";
import { AbstractBaseQueryImpl } from "./abstract_base_query_impl";

export class AtomBaseQueryImpl<TProjection> 
extends AbstractBaseQueryImpl<TProjection>
implements 
    AtomBaseQuery<TProjection>, 
    metadata.BaseQueryImplementor<TProjection>, 
    ast.AtomQueryContract {

    readonly options: ast.AtomQueryOptions;

    constructor(
        private readonly mutableQuery: MutableBaseQueryImpl,
        readonly _projection: MapBaseQueryProjection<BaseQueryMapOf<TProjection>>,
        options: ast.AtomQueryOptions | undefined
    ) {
        super();
        this.options = options ?? ast.defaultAtomQueryOptions;
    }

    __type(): { 
        baseQuery: TProjection | true; 
        atomBaseQuery: TProjection | true;
    } {
        return { baseQuery: true, atomBaseQuery: true };
    }

    distinct(): BaseQuery<TProjection> {
        return new AtomBaseQueryImpl(
            this.mutableQuery,
            this._projection,
            {...this.options, distinct: true }
        );
    }

    limit(limit: number): AtomBaseQuery<TProjection> {
        return new AtomBaseQueryImpl(
            this.mutableQuery,
            this._projection,
            {...this.options, limit }
        );
    }

    offset(offset: number): AtomBaseQuery<TProjection> {
        return new AtomBaseQueryImpl(
            this.mutableQuery,
            this._projection,
            {...this.options, offset }
        );
    }

    get args(): BaseQueryMapOf<TProjection> {
        return this._projection.args;
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
        return this._projection as any as ast.ProjectionContract;
    }

    accept(visitor: ast.Visitor): void {
        visitor.visitAtomQuery(this);
    }
}

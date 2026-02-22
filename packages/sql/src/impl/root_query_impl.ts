import { ast, ExpressionOrder, metadata, RootQuery, RootQueryProjection, RowTypeOf } from "@ts-grm/core";
import { MutableRootQueryImpl } from "./mutable_root_query_impl";
import { AbstractRootQueryProjection } from "./query_projection";

export class RootQueryImpl<TProjection extends RootQueryProjection<any>> 
implements RootQuery<TProjection>, ast.AtomQueryContract {

    readonly options: ast.AtomQueryOptions;

    constructor(
        private readonly mutableQuery: MutableRootQueryImpl,
        private _projection: AbstractRootQueryProjection<any>,
        options: ast.AtomQueryOptions | undefined
    ) {
        this.options = options ?? ast.defaultAtomQueryOptions;
    }

    __type(): { rootQuery: TProjection | true; } {
        return { rootQuery: true };
    }

    distinct(): RootQuery<TProjection> {
        return new RootQueryImpl(
            this.mutableQuery,
            this._projection,
            {...this.options, distinct: true }
        );
    }

    limit(limit: number): RootQuery<TProjection> {
        return new RootQueryImpl(
            this.mutableQuery,
            this._projection,
            {...this.options, limit }
        );
    }

    offset(offset: number): RootQuery<TProjection> {
        return new RootQueryImpl(
            this.mutableQuery,
            this._projection,
            {...this.options, offset }
        );
    }

    fetchList(): Promise<Array<RowTypeOf<TProjection>>> {
        throw new Error();
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
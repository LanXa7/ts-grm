import { ast, ExpressionOrder, metadata, AtomRootQuery, RootQueryProjection, RowTypeOf, suppressUnused } from "@ts-grm/core";
import { MutableRootQueryImpl } from "./mutable_root_query_impl";
import { AbstractRootQueryProjection } from "./query_projection";

export class AtomRootQueryImpl<TProjection extends RootQueryProjection<any>> 
implements AtomRootQuery<TProjection>, ast.AtomQueryContract {

    readonly options: ast.AtomQueryOptions;

    constructor(
        readonly mutableQuery: MutableRootQueryImpl,
        private _projection: AbstractRootQueryProjection<any>,
        options: ast.AtomQueryOptions | undefined
    ) {
        this.options = options ?? ast.defaultAtomQueryOptions;
    }

    __type(): { 
        rootQuery: TProjection | true; 
        atomRootQuery: TProjection | true;
    } {
        return { rootQuery: true, atomRootQuery: true };
    }

    get level(): "ROOT" {
        return "ROOT";
    }

    distinct(): AtomRootQuery<TProjection> {
        return new AtomRootQueryImpl(
            this.mutableQuery,
            this._projection,
            {...this.options, distinct: true }
        );
    }

    limit(limit: number): AtomRootQuery<TProjection> {
        return new AtomRootQueryImpl(
            this.mutableQuery,
            this._projection,
            {...this.options, limit }
        );
    }

    offset(offset: number): AtomRootQuery<TProjection> {
        return new AtomRootQueryImpl(
            this.mutableQuery,
            this._projection,
            {...this.options, offset }
        );
    }

    fetchList<TNullAsUndefined extends boolean = false>(
        options?: {
            readonly nullAsUndefined?: TNullAsUndefined;
        }
    ): Promise<Array<RowTypeOf<TProjection, TNullAsUndefined>>> {
        suppressUnused(options);
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

    get isRecursive(): boolean {
        return false;
    }

    get recursivePred(): ast.AbstractPred | undefined {
        return undefined;
    }

    accept(visitor: ast.Visitor): void {
        visitor.visitAtomQuery(this);
    }
}
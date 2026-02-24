import { ast, ExpressionOrder, metadata, SubQueryProjection } from "@ts-grm/core";
import { 
    AbstractDtSubQueryImpl, 
    AbstractNumSubQueryImpl, 
    AbstractStrSubQueryImpl, 
    AbstractExprSubQueryImpl, 
    AbstractTupleSubQueryImpl 
} from "./abstract_sub_query_impl";
import { MutableSubQueryImpl } from "./mutable_sub_query_impl";

export class AtomTupleSubQueryImpl extends AbstractTupleSubQueryImpl implements ast.AtomQueryContract {

    readonly options: ast.AtomQueryOptions;

    constructor(
        readonly mutableQuery: MutableSubQueryImpl,
        readonly _projection: SubQueryProjection<any>,
        optins: ast.AtomQueryOptions | undefined
    ) {
        super();
        this.options = optins ?? ast.defaultAtomQueryOptions;
    }

    distinct(): AtomTupleSubQueryImpl {
        return new AtomTupleSubQueryImpl(
            this.mutableQuery,
            this._projection,
            { ...this.options, distinct: true }
        );
    }

    limit(limit: number): AtomTupleSubQueryImpl {
        return new AtomTupleSubQueryImpl(
            this.mutableQuery,
            this._projection,
            { ...this.options, limit }
        );
    }

    offset(offset: number): AtomTupleSubQueryImpl {
        return new AtomTupleSubQueryImpl(
            this.mutableQuery,
            this._projection,
            { ...this.options, offset }
        );
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

export class AtomExprSubQueryImpl extends AbstractExprSubQueryImpl implements ast.AtomQueryContract {

    readonly options: ast.AtomQueryOptions;

    constructor(
        readonly mutableQuery: MutableSubQueryImpl,
        readonly _projection: SubQueryProjection<any>,
        optins: ast.AtomQueryOptions | undefined
    ) {
        super();
        this.options = optins ?? ast.defaultAtomQueryOptions;
    }

    distinct(): AtomExprSubQueryImpl {
        return new AtomExprSubQueryImpl(
            this.mutableQuery,
            this._projection,
            { ...this.options, distinct: true }
        );
    }

    limit(limit: number): AtomExprSubQueryImpl {
        return new AtomExprSubQueryImpl(
            this.mutableQuery,
            this._projection,
            { ...this.options, limit }
        );
    }

    offset(offset: number): AtomExprSubQueryImpl {
        return new AtomExprSubQueryImpl(
            this.mutableQuery,
            this._projection,
            { ...this.options, offset }
        );
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

export class AtomNumSubQueryImpl extends AbstractNumSubQueryImpl implements ast.AtomQueryContract {

    readonly options: ast.AtomQueryOptions;

    constructor(
        readonly mutableQuery: MutableSubQueryImpl,
        readonly _projection: SubQueryProjection<any>,
        optins: ast.AtomQueryOptions | undefined
    ) {
        super();
        this.options = optins ?? ast.defaultAtomQueryOptions;
    }

    distinct(): AtomNumSubQueryImpl {
        return new AtomNumSubQueryImpl(
            this.mutableQuery,
            this._projection,
            { ...this.options, distinct: true }
        );
    }

    limit(limit: number): AtomNumSubQueryImpl {
        return new AtomNumSubQueryImpl(
            this.mutableQuery,
            this._projection,
            { ...this.options, limit }
        );
    }

    offset(offset: number): AtomNumSubQueryImpl {
        return new AtomNumSubQueryImpl(
            this.mutableQuery,
            this._projection,
            { ...this.options, offset }
        );
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

export class AtomStrSubQueryImpl extends AbstractStrSubQueryImpl implements ast.AtomQueryContract {

    readonly options: ast.AtomQueryOptions;

    constructor(
        readonly mutableQuery: MutableSubQueryImpl,
        readonly _projection: SubQueryProjection<any>,
        optins: ast.AtomQueryOptions | undefined
    ) {
        super();
        this.options = optins ?? ast.defaultAtomQueryOptions;
    }

    distinct(): AtomStrSubQueryImpl {
        return new AtomStrSubQueryImpl(
            this.mutableQuery,
            this._projection,
            { ...this.options, distinct: true }
        );
    }

    limit(limit: number): AtomStrSubQueryImpl {
        return new AtomStrSubQueryImpl(
            this.mutableQuery,
            this._projection,
            { ...this.options, limit }
        );
    }

    offset(offset: number): AtomStrSubQueryImpl {
        return new AtomStrSubQueryImpl(
            this.mutableQuery,
            this._projection,
            { ...this.options, offset }
        );
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

export class AtomDtSubQueryImpl extends AbstractDtSubQueryImpl implements ast.AtomQueryContract {

    readonly options: ast.AtomQueryOptions;

    constructor(
        readonly mutableQuery: MutableSubQueryImpl,
        readonly _projection: SubQueryProjection<any>,
        optins: ast.AtomQueryOptions | undefined
    ) {
        super();
        this.options = optins ?? ast.defaultAtomQueryOptions;
    }

    get kind(): "ATOM" {
        return "ATOM";
    }

    distinct(): AtomDtSubQueryImpl {
        return new AtomDtSubQueryImpl(
            this.mutableQuery,
            this._projection,
            { ...this.options, distinct: true }
        );
    }

    limit(limit: number): AtomDtSubQueryImpl {
        return new AtomDtSubQueryImpl(
            this.mutableQuery,
            this._projection,
            { ...this.options, limit }
        );
    }

    offset(offset: number): AtomDtSubQueryImpl {
        return new AtomDtSubQueryImpl(
            this.mutableQuery,
            this._projection,
            { ...this.options, offset }
        );
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

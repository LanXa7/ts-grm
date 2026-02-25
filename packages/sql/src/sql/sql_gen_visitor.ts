import { ast, err } from "@ts-grm/core";
import { AstContext } from "./ast_context";
import { Composite, Fragment, Scope, Separator } from "./fragment";

export class SqlGenVisitor extends ast.AbstractVisitor {

    private _fragmentScope: FragmentScope | undefined;

    private _result: Composite | undefined;

    constructor(
        private readonly ctx: AstContext
    ) {
        super();
    }

    visitAtomQuery(query: ast.AtomQueryContract): void {
        this._push(new Composite());
        
        this._composite.text("select ");
        this._push(new Scope("INDENT"));
        this._visitProjection(query.projection);
        this._pop();

        const wherePred = query.wherePred;
        if (wherePred != null) {
            this._composite.text("where ");
            this._push(new Scope("INDENT"));
            query.wherePred?.accept(this);
            this._pop();
        }

        const orders = query.orders;
        if (orders.length !== 0) {
            this._composite.text("where ");
            this._push(new Scope("COMMA"));
            for (const order of query.orders) {
                this._composite.separator();
                (order.expression as ast.AbstractExpr<any>).accept(this);
            }
            this._pop();
        }

        const groupByExprs = query.groupByExprs;
        if (groupByExprs != null) {
            this._composite.text("group by ");
            this._push(new Scope("COMMA"));
            for (const expr of groupByExprs) {
                this._composite.separator();
                expr.accept(this);
            }
            this._pop();
        }

        const havingPred = query.havingPred;
        if (havingPred != null) {
            this._composite.text("having ");
            this._push(new Scope("INDENT"));
            havingPred.accept(this);
            this._pop();
        }

        this._result = this._composite;
        this._pop();

        if (this._fragmentScope != null) {
            throw new err.StateError("Internal bug, stack is not empty after rendering");
        }
    }

    visitMergedQuery(query: ast.MergedQueryContract): void {
        this._push(new Scope(query.kind));
        for (const qry of query.queries) {
            this._composite.separator();
            qry.accept(this);
        }
        this._pop();
    }

    visitTuple(tuple: ast.TupleContract): void {
        this._push(new Scope("VALUES"));
        for (const expr of tuple.exprs) {
            this._composite.separator();
            expr.accept(this);
        }
        this._pop();
    }

    visitTupleCmpPred(pred: ast.TupleCmpPred): void {
        pred.leftTuple.accept(this);
        pred.rightTuple.accept(this);
    }

    visitTupleInCollectionPred(pred: ast.TupleInCollectionPred): void {
        pred.tuple.accept(this);
        for (const tuple of pred.tuples) {
            tuple.accept(this);
        }
    }

    visitTupleInSubQueryPred(pred: ast.TupleInSubQueryPred): void {
        pred.tuple.accept(this);
        pred.subQuery.accept(this);
    }

    visitCmpPred(pred: ast.CmpPred): void {
        pred.leftExpr.accept(this);
        pred.rightExpr.accept(this);
    }

    visitInCollectionPred(pred: ast.InCollectionPred<any>): void {
        pred.expr.accept(this);
    }

    visitInSubQueryPred(pred: ast.InSubQueryPred): void {
        pred.expr.accept(this);
        pred.subQuery.accept(this);
    }

    visitBetweenPred(pred: ast.BetweenPred): void {
        pred.expr.accept(this);
        pred.minExpr.accept(this);
        pred.maxExpr.accept(this);
    }

    visitLikePred(pred: ast.LikePred): void {
        pred.expr.accept(this);
    }

    visitNullityPred(pred: ast.NullityPred): void {
        pred.expr.accept(this);
    }

    visitCompoundPred(pred: ast.CompoundPred): void {
        for (const p of pred.preds) {
            p.accept(this);
        }
    }

    visitExistsPred(pred: ast.ExistsPred): void {
        pred.subQuery.accept(this);
    }

    visitTablePropExpr(_: ast.PropExprContract): void {

    }

    visitCoalesceExpr(expr: ast.CoalesceExprContract): void {
        expr.expr.accept(this);
        for (const defaultExpr of expr.defaultExprs) {
            defaultExpr.accept(this);
        }
    }

    visitNativeExpr(expr: ast.NativeExprContract): void {
        for (const part of expr.parts) {
            if (part instanceof ast.AbstractExpr) {
                part.accept(this);
            }
        }
    }

    visitSubQueryExpr(expr: ast.SubQueryExprContract): void {
        expr.subQuery.accept(this);
    }

    visitShdowExpr(_: ast.ShadowExprContract): void {

    }

    visitLowerExpr(expr: ast.LowerExpr): void {
        expr.expr.accept(this);
    }

    visitUpperExpr(expr: ast.UpperExpr): void {
        expr.expr.accept(this);
    }

    visitReverseExpr(expr: ast.ReverseExpr): void {
        expr.expr.accept(this);
    }

    visitTrimExpr(expr: ast.TrimExpr): void {
        expr.expr.accept(this);
    }

    visitLengthExpr(expr: ast.LengthExpr): void {
        expr.expr.accept(this);
    }

    visitReplaceExpr(expr: ast.ReplaceExpr): void {
        expr.expr.accept(this);
        expr.oldStrExpr.accept(this);
        expr.newStrExpr.accept(this);
    }

    visitPadExpr(expr: ast.PadExpr): void {
        expr.expr.accept(this);
        expr.lenExpr.accept(this);
        expr.padExpr?.accept(this);
    }

    visitLeftExpr(expr: ast.LeftExpr): void {
        expr.expr.accept(this);
        expr.lenExpr.accept(this);
    }

    visitRightExpr(expr: ast.RightExpr): void {
        expr.expr.accept(this);
        expr.lenExpr.accept(this);
    }

    visitPositionExpr(expr: ast.PositionExpr): void {
        expr.expr.accept(this);
        expr.substrExpr.accept(this);
        expr.startExpr?.accept(this);
    }

    visitSubstringExpr(expr: ast.SubstringExpr): void {
        expr.expr.accept(this);
        expr.startExpr.accept(this);
        expr.lenExpr?.accept(this);
    }

    visitConcatExpr(expr: ast.ConcatExpr): void {
        for (const valueExpr of expr.valueExprs) {
            valueExpr.accept(this);
        }
    }

    visitUnaryMinusExpr(expr: ast.UnaryMinusExpr<any>): void {
        expr.expr.accept(this);
    }

    visitBinaryNumExpr(expr: ast.BinaryNumExpr<any>): void {
        expr.leftExpr.accept(this);
        expr.rightExpr.accept(this);
    }

    visitAggregateExpr(expr: ast.AggregateExpr<any>): void {
        expr.expr?.accept(this);
    }

    visitDtPlusExpr(expr: ast.DtPlusExpr): void {
        expr.expr.accept(this);
        expr.valueExpr.accept(this);
    }

    visitDtMinusExpr(expr: ast.DtMinusExpr): void {
        expr.expr.accept(this);
        expr.valueExpr.accept(this);
    }

    visitDtDiffExpr(expr: ast.DtDiffExpr): void {
        expr.expr.accept(this);
        expr.valueExpr.accept(this);
    }

    visitLiteral(_: any): void {

    }

    private _visitProjection(projection: ast.ProjectionContract): void {
        switch (projection.kind) {
            case "ROOT_SINGLE":
        }
    }

    private _push(composite: Composite) {
        this._fragmentScope = {
            parent: this._fragmentScope,
            composite
        };
    }

    private _pop() {
        const parent = this._fragmentScope?.parent;
        if (parent == null) {
            this._fragmentScope = undefined;
        } else {
            parent.composite.add(this._fragmentScope!.composite);
            this._fragmentScope = parent;
        }
    }

    private get _composite(): Composite {
        return this._fragmentScope?.composite ?? err.makeErr("No current composite");
    }
}

type FragmentScope = {
    readonly parent: FragmentScope | undefined;
    readonly composite: Composite;
};
import { ast, err, metadata } from "@ts-grm/core";
import { Column, Composite, Scope, Value } from "./fragment";
import { Stack } from "./stack";
import { Precedence } from "./precedence";
import { JoinMergeScope } from "./join_merge_scope";
import { NodeRender, NodeRenderContext } from "@/driver/fun_render";
import { RealTable } from "./real_table";
import { SqlClientImplementor } from "@/sql_client";

export class FragmentGenGenVisitor extends ast.AbstractVisitor {

    private readonly _compositeStack: Stack<Composite>;

    private readonly _precedenceStack: Stack<number>;

    private _tableMap = new Map<metadata.AbstractEntityTable | metadata.BaseTableTarget, RealTable>();

    private readonly _joinMergeScopeStack =
        new Stack<JoinMergeScope>(undefined);

    private readonly _nodeRender: NodeRender;

    private readonly _nodeRenderContext: NodeRenderContext;

    constructor(
        readonly sqlClient: SqlClientImplementor
    ) {
        super();
        this._nodeRender = sqlClient.driver.nodeRender;
        const that = this;
        this._compositeStack = new class extends Stack<Composite> {
            constructor() {
                super(undefined);
            }
            override with(composite: Composite): Disposable {
                const parent = this.currentOrUndefined;
                if (parent != null) {
                    parent.add(composite);
                }
                return super.with(composite);
            }
        };
        this._precedenceStack = new class extends Stack<number> {

            constructor() {
                super(Precedence.ROOT);
            }

            override with(precedence: number): Disposable {
                const disposable1 = super.with(precedence);
                if (precedence === Precedence.ROOT) {
                    return disposable1;
                }
                const current = this.current;
                if (current <= precedence) {
                    return disposable1;
                }
                that._compositeStack.current.text("(");
                return {
                    [Symbol.dispose]() {
                        that._compositeStack.current.text(")");
                        disposable1[Symbol.dispose]();
                    }
                };
            }
        };
        this._nodeRenderContext = new class implements NodeRenderContext {

            text(value: string): void {
                that._compositeStack.current.text(value);
            }
            
            separator(): void {
                that._compositeStack.current.separator();
            }
        
            withCompoisite(composite: Composite): Disposable {
                return that._compositeStack.with(composite);
            }
        
            withPrecedence(precedence: number): Disposable {
                return that._precedenceStack.with(precedence);
            }
        
            render(node: ast.Node): void {
                node.accept(that);
            }
        }
        // No disposing to record the root result
        this._compositeStack.with(new Composite());
    }

    visitAtomQuery(query: ast.AtomQueryContract): void {

        let isRoot: boolean;
        switch (query.projection.kind) {
            case "ROOT_SINGLE":
            case "ROOT_ARRAY":
            case "ROOT_MAP":
                isRoot = true;
                break;
            default:
                isRoot = false;
        }

        using _ = this._compositeStack.with(new Composite());
        using __ = this._precedenceStack.with(Precedence.ROOT);

        if (!isRoot) {
            this._compositeStack.current.text("(");
        }
        
        {
            this._compositeStack.current.text("select ");
            using _ = this._compositeStack.with(new Scope("INDENT"));
            this._visitProjection(query.projection);
        }

        const wherePred = query.wherePred;
        if (wherePred != null) {
            this._compositeStack.current.text("where ");
            using _ = this._compositeStack.with(new Scope("INDENT"));
            query.wherePred?.accept(this);
        }

        const orders = query.orders;
        if (orders.length !== 0) {
            this._compositeStack.current.text("order by ");
            using _ = this._compositeStack.with(new Scope("COMMA"));
            for (const order of query.orders) {
                this._compositeStack.current.separator();
                (order.expression as ast.AbstractExpr<any>).accept(this);
            }
        }

        const groupByExprs = query.groupByExprs;
        if (groupByExprs != null) {
            this._compositeStack.current.text("group by ");
            using _ = this._compositeStack.with(new Scope("COMMA"));
            for (const expr of groupByExprs) {
                this._compositeStack.current.separator();
                expr.accept(this);
            }
        }

        const havingPred = query.havingPred;
        if (havingPred != null) {
            this._compositeStack.current.text("having ");
            using _ = this._compositeStack.with(new Scope("INDENT"));
            havingPred.accept(this);
        }

        if (!isRoot) {
            this._compositeStack.current.text(")");
        }
    }

    visitMergedQuery(query: ast.MergedQueryContract): void {
        using _ = this._compositeStack.with(new Scope(query.kind));
        for (const qry of query.queries) {
            this._compositeStack.current.separator();
            qry.accept(this);
        }
    }

    visitTuple(tuple: ast.TupleContract): void {
        using _ = this._compositeStack.with(new Scope("VALUES"));
        using __ = this._precedenceStack.with(Precedence.ROOT);
        for (const expr of tuple.exprs) {
            this._compositeStack.current.separator();
            expr.accept(this);
        }
    }

    visitTupleCmpPred(pred: ast.TupleCmpPred): void {
        using _ = this._precedenceStack.with(Precedence.COMPARISON);
        pred.leftTuple.accept(this);
        this._compositeStack.current.text(" ").text(pred.op).text(" ");
        pred.rightTuple.accept(this);
    }

    visitTupleInCollectionPred(pred: ast.TupleInCollectionPred): void {
        
        using _ = this._precedenceStack.with(Precedence.COMPARISON);

        pred.tuple.accept(this);
        this._compositeStack.current.text(pred.neg ? " not in" : " in");

        using __ = this._compositeStack.with(new Scope("VALUES"));
        using ___ = this._precedenceStack.with(Precedence.ROOT);
        for (const tuple of pred.tuples) {
            this._compositeStack.current.separator();
            tuple.accept(this);
        }
    }

    visitTupleInSubQueryPred(pred: ast.TupleInSubQueryPred): void {
        
        using _ = this._precedenceStack.with(Precedence.COMPARISON);

        pred.tuple.accept(this);
        this._compositeStack.current.text(pred.neg ? " not in" : " in");

        using __ = this._compositeStack.with(new Scope("VALUES"));
        using ___ = this._precedenceStack.with(Precedence.ROOT);
        pred.subQuery.accept(this);
    }

    visitCmpPred(pred: ast.CmpPred): void {
        using _ = this._precedenceStack.with(Precedence.COMPARISON);
        pred.leftExpr.accept(this);
        this._compositeStack.current.text(" ").text(pred.op).text(" ");
        pred.rightExpr.accept(this);
    }

    visitInCollectionPred(pred: ast.InCollectionPred<any>): void {
        using _ = this._precedenceStack.with(Precedence.COMPARISON);
        pred.expr.accept(this);
        this._compositeStack.current.text(pred.neg ? " not in" : " in");
        using __ = this._compositeStack.with(new Scope("VALUES"));
        using ___ = this._precedenceStack.with(Precedence.ROOT);
        for (const value of pred.values) {
            value.accept(this);
        }
    }

    visitInSubQueryPred(pred: ast.InSubQueryPred): void {
        using _ = this._precedenceStack.with(Precedence.COMPARISON);
        pred.expr.accept(this);
        this._compositeStack.current.text(pred.neg ? " not in" : " in");
        using __ = this._compositeStack.with(new Scope("VALUES"));
        using ___ = this._precedenceStack.with(Precedence.ROOT);
        pred.subQuery.accept(this);
    }

    visitBetweenPred(pred: ast.BetweenPred): void {
        using _ = this._precedenceStack.with(Precedence.COMPARISON);
        pred.expr.accept(this);
        this._compositeStack.current.text(" between ");
        pred.minExpr.accept(this);
        this._compositeStack.current.text(" and ");
        pred.maxExpr.accept(this);
    }

    visitLikePred(pred: ast.LikePred): void {
        using _ = this._precedenceStack.with(Precedence.COMPARISON);
        pred.expr.accept(this);
        pred.pattern.accept(this);
    }

    visitNullityPred(pred: ast.NullityPred): void {
        using _ = this._precedenceStack.with(Precedence.UNARY);
        pred.expr.accept(this);
        if (pred.neg) {
            this._compositeStack.current.text(" is not null");
        } else {
            this._compositeStack.current.text(" is null");
        }
    }

    visitCompoundPred(pred: ast.CompoundPred): void {
        if (pred.op === "AND") {
            using _ = this._precedenceStack.with(Precedence.AND);
            for (const p of pred.preds) {
                p.accept(this);
            }
        } else {
            this._precedenceStack.with(Precedence.OR);
            for (const p of pred.preds) {
                using _ = this._joinMergeScopeStack.with(new JoinMergeScope());
                p.accept(this);
            }
        }
    }

    visitExistsPred(pred: ast.ExistsPred): void {
        using _ = this._precedenceStack.with(Precedence.UNARY);
        this._compositeStack.current.text(pred.neg ? " not exists" : "exists")
        pred.subQuery.accept(this);
    }

    visitTablePropExpr(expr: ast.PropExprContract): void {
        const realTable = this._toRealTable(expr.table);
        this._compositeStack.current.add(new Column(realTable, expr.prop.name));
    }

    visitCoalesceExpr(expr: ast.CoalesceExprContract): void {
        this._compositeStack.current.text("coalesce")
        using _ = this._compositeStack.with(new Scope("VALUES"));
        using __ = this._precedenceStack.with(Precedence.ROOT);
        expr.expr.accept(this);
        for (const defaultExpr of expr.defaultExprs) {
            this._compositeStack.current.separator();
            defaultExpr.accept(this);
        }
    }

    visitNativeExpr(expr: ast.NativeExprContract): void {
        using _ = this._precedenceStack.with(Precedence.ROOT);
        const current = this._compositeStack.current;
        for (const part of expr.parts) {
            if (typeof part === "string") {
                current.text(part);
            } else {
                (part as ast.AbstractExpr<any>).accept(this);
            }
        }
    }

    visitSubQueryExpr(expr: ast.SubQueryExprContract): void {
        this._compositeStack.current.text(expr.op.toLowerCase());
        expr.subQuery.accept(this);
    }

    visitShdowExpr(_: ast.ShadowExprContract): void {

    }

    visitLowerExpr(expr: ast.LowerExpr): void {
        using _ = this._precedenceStack.with(Precedence.ROOT);
        const current = this._compositeStack.current;
        current.text("lower(");
        expr.expr.accept(this);
        current.text(")");
    }

    visitUpperExpr(expr: ast.UpperExpr): void {
        using _ = this._precedenceStack.with(Precedence.ROOT);
        const current = this._compositeStack.current;
        current.text("upper(");
        expr.expr.accept(this);
        current.text(")");
    }

    visitReverseExpr(expr: ast.ReverseExpr): void {
        this._nodeRender.renderReverseExpr(expr, this._nodeRenderContext);
    }

    visitTrimExpr(expr: ast.TrimExpr): void {
        this._nodeRender.renderTrimExpr(expr, this._nodeRenderContext);
    }

    visitLengthExpr(expr: ast.LengthExpr): void {
        this._nodeRender.renderLengthExpr(expr, this._nodeRenderContext);
    }

    visitReplaceExpr(expr: ast.ReplaceExpr): void {
        using _ = this._precedenceStack.with(Precedence.ROOT);
        const current = this._compositeStack.current;
        current.text("replace(");
        expr.expr.accept(this);
        current.text(", ");
        expr.oldStrExpr.accept(this);
        current.text(", ");
        expr.newStrExpr.accept(this);
        current.text(")");
    }

    visitPadExpr(expr: ast.PadExpr): void {
        this._nodeRender.renderPadExpr(expr, this._nodeRenderContext);
    }

    visitLeftExpr(expr: ast.LeftExpr): void {
        this._nodeRender.renderLeftExpr(expr, this._nodeRenderContext);
    }

    visitRightExpr(expr: ast.RightExpr): void {
        this._nodeRender.renderRightExpr(expr, this._nodeRenderContext);
    }

    visitPositionExpr(expr: ast.PositionExpr): void {
        this._nodeRender.renderPositionExpr(expr, this._nodeRenderContext);
    }

    visitSubstringExpr(expr: ast.SubstringExpr): void {
        this._nodeRender.renderSubstringExpr(expr, this._nodeRenderContext);
    }

    visitConcatExpr(expr: ast.ConcatExpr): void {
        for (const valueExpr of expr.valueExprs) {
            valueExpr.accept(this);
        }
    }

    visitUnaryMinusExpr(expr: ast.UnaryMinusExpr<any>): void {
        using _ = this._precedenceStack.with(Precedence.UNARY);
        this._compositeStack.current.text("-");
        expr.expr.accept(this);
    }

    visitBinaryNumExpr(expr: ast.BinaryNumExpr<any>): void {
        using _ = this._precedenceStack.with(
            expr.op === "+" || expr.op === "-"
                ? Precedence.PLUS
                : Precedence.TIMES
        );
        expr.leftExpr.accept(this);
        this._compositeStack.current.text(expr.op);
        expr.rightExpr.accept(this);
    }

    visitAggregateExpr(expr: ast.AggregateExpr<any>): void {
        using _ = this._precedenceStack.with(Precedence.ROOT);
        const current = this._compositeStack.current;
        current.text(expr.op.toLowerCase());
        current.text("(");
        if (expr.expr == null) {
            current.text("1");
        } else {
            expr.expr.accept(this);
        }
        current.text(")");
    }

    visitDtPlusExpr(expr: ast.DtPlusExpr): void {
        this._nodeRender.renderDtPlusExpr(expr, this._nodeRenderContext);
    }

    visitDtDiffExpr(expr: ast.DtDiffExpr): void {
        expr.expr.accept(this);
        expr.valueExpr.accept(this);
    }

    visitLiteral(value: any): void {
        this._compositeStack.current.add(new Value(value));
    }

    private _visitProjection(projection: ast.ProjectionContract): void {
        switch (projection.kind) {
            case "ROOT_SINGLE":
        }
    }

    private _toRealTable(table: metadata.AbstractEntityTable | metadata.BaseTableTarget): RealTable {
        let realTable = this._tableMap.get(table);
        if (realTable == null) {
            const joinOperation = table instanceof metadata.AbstractEntityTable 
                ? table.joinOperation
                : undefined;
            if (joinOperation == null) {
                realTable = new RealTable(table);
            } else {
                const parentRealTable = this._toRealTable(joinOperation.parent);
                realTable = parentRealTable.child(
                    table as metadata.AbstractEntityTable, 
                    this._joinMergeScopeStack.currentOrUndefined
                );
            }
            if (table instanceof metadata.AbstractEntityTable) {
                // const anchor = table.anchor;
                // if (anchor != null) {
                //     realTable._shadow = this.toRealTable(shadow);
                // }
                // TODO
            }
            this._tableMap.set(table, realTable);
        }
        return realTable;
    }

    toResult(): Composite {
        if (this._joinMergeScopeStack.size() !== 0) {
            throw new err.StateError("joinMergeScopeStack is not cleanup");
        }
        if (this._precedenceStack.size() !== 0) {
            throw new err.StateError("precedenceStack is not cleanup");
        }
        if (this._compositeStack.size() != 1) {
            throw new err.StateError("compositeStack is not cleanup");
        }
        return this._compositeStack.current.fragments![0]! as Composite;
    }
}

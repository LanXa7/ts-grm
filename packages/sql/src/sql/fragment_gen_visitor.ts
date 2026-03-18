import { ast, err, metadata } from "@ts-grm/core";
import { Alias, Column, Composite, Query, Scope, ShadowExpr, Source, Value } from "./fragment";
import { Stack } from "./stack";
import { Precedence } from "./precedence";
import { NodeRender, NodeRenderContext } from "@/driver/node_render";
import { RealTable } from "./real_table";
import { SqlClientImplementor } from "@/sql_client";
import { BaseQueryMetadata } from "./base_query_metadata";
import { TableFragmentCreator } from "./table_fragment_creator";
import { addTypeMatch } from "./utils";

export class FragmentGenGenVisitor extends ast.AbstractVisitor {

    private readonly _compositeStack: Stack<Composite>;

    private readonly _precedenceStack: Stack<number>;

    private readonly _strategy: metadata.DatabaseNamingStrategy;

    private readonly _nodeRender: NodeRender;

    private readonly _nodeRenderContext: NodeRenderContext;

    private readonly _tableFragmentCreator: TableFragmentCreator;

    constructor(
        readonly sqlClient: SqlClientImplementor,
        private readonly _baseQueryMetadata: BaseQueryMetadata | undefined,
        private readonly _tableMap: ReadonlyMap<metadata.AbstractTable, RealTable>
    ) {
        super();
        this._strategy = sqlClient.options.strategy;
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
                that._compositeStack.current.add("(");
                return {
                    [Symbol.dispose]() {
                        that._compositeStack.current.add(")");
                        disposable1[Symbol.dispose]();
                    }
                };
            }
        };
        this._nodeRenderContext = new class implements NodeRenderContext {

            text(value: string): void {
                that._compositeStack.current.add(value);
            }
            
            separator(): void {
                that._compositeStack.current.separator();
            }
        
            withComposite(composite: Composite): Disposable {
                return that._compositeStack.with(composite);
            }
        
            withPrecedence(precedence: number): Disposable {
                return that._precedenceStack.with(precedence);
            }
        
            render(node: ast.Node): void {
                node.accept(that);
            }
        }
        this._tableFragmentCreator = new TableFragmentCreator(
            this.sqlClient,
            (realTable, columnName) => this._createColumn(realTable, columnName),
            () => this._cloneVisitor()
        );
        // No disposing to record the root result
        this._compositeStack.with(new Composite());
    }

    private _cloneVisitor() {
        return new FragmentGenGenVisitor(
            this.sqlClient,
            this._baseQueryMetadata,
            this._tableMap
        );
    }

    visitAtomQuery(query: ast.AtomQueryContract): void {

        using _ = this._compositeStack.with(new Query());
        using __ = this._precedenceStack.with(Precedence.ROOT);
        
        {
            this._compositeStack.current.add("select ");
            using _ = this._compositeStack.with(new Scope("COMMA"));
            this._visitProjection(query.projection);
        }

        {
            this._compositeStack.current.add("\nfrom ");
            let recursive: { prev: RealTable, pred: Composite } | undefined = undefined;
            if (query.recursivePred != null) {
                const visitor = this._cloneVisitor();
                query.recursivePred.accept(visitor);
                recursive = { prev: this._baseQueryMetadata!.realTable, pred: visitor.toResult() };
            }
            const tables = query.tables.map(t => 
                this._toRealTable(
                    t as metadata.AbstractEntityTable | metadata.TypedBaseTable
                )
            );
            this._fillTableFragments(tables);
            using _ = this._compositeStack.with(new Source(tables, recursive));
        }

        const wherePred = query.wherePred;
        if (wherePred != null) {
            this._compositeStack.current.add("\nwhere ");
            using _ = this._compositeStack.with(new Scope("INDENT"));
            query.wherePred?.accept(this);
        }

        const orders = query.orders;
        if (orders.length !== 0) {
            this._compositeStack.current.add("\norder by ");
            using _ = this._compositeStack.with(new Scope("COMMA"));
            const current = this._compositeStack.current;
            for (const order of query.orders) {
                current.separator();
                (order.expression as ast.AbstractExpr<any>).accept(this);
                current.add(order.desc ? " desc" : " asc");
                if (order.nullsType !== "UNSPECIFIED") {
                    current.add(`nulls ${order.nullsType.toLowerCase()}`);
                }
            }
        }

        const groupByExprs = query.groupByExprs;
        if (groupByExprs != null) {
            this._compositeStack.current.add("\ngroup by ");
            using _ = this._compositeStack.with(new Scope("COMMA"));
            for (const expr of groupByExprs) {
                this._compositeStack.current.separator();
                expr.accept(this);
            }
        }

        const havingPred = query.havingPred;
        if (havingPred != null) {
            this._compositeStack.current.add("\nhaving ");
            using _ = this._compositeStack.with(new Scope("INDENT"));
            havingPred.accept(this);
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
        this._compositeStack.current.add(" ").add(pred.op).add(" ");
        pred.rightTuple.accept(this);
    }

    visitTupleInCollectionPred(pred: ast.TupleInCollectionPred): void {
        
        using _ = this._precedenceStack.with(Precedence.COMPARISON);

        pred.tuple.accept(this);
        this._compositeStack.current.add(pred.neg ? " not in" : " in");

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
        this._compositeStack.current.add(pred.neg ? " not in" : " in");

        using __ = this._compositeStack.with(new Scope("VALUES"));
        using ___ = this._precedenceStack.with(Precedence.ROOT);
        pred.subQuery.accept(this);
    }

    visitConstantPred(pred: ast.ConstantPred): void {
        this._compositeStack.current.add(pred.value ? "1 = 1" : "1 = 0");
    }

    visitCmpPred(pred: ast.CmpPred): void {
        using _ = this._precedenceStack.with(Precedence.COMPARISON);
        pred.leftExpr.accept(this);
        this._compositeStack.current.add(" ").add(pred.op).add(" ");
        pred.rightExpr.accept(this);
    }

    visitInCollectionPred(pred: ast.InCollectionPred<any>): void {
        this._nodeRender.renderInCollectionPred(pred, this._nodeRenderContext);
    }

    visitInSubQueryPred(pred: ast.InSubQueryPred): void {
        using _ = this._precedenceStack.with(Precedence.COMPARISON);
        pred.expr.accept(this);
        this._compositeStack.current.add(pred.neg ? " not in" : " in");
        using __ = this._compositeStack.with(new Scope("VALUES"));
        using ___ = this._precedenceStack.with(Precedence.ROOT);
        pred.subQuery.accept(this);
    }

    visitBetweenPred(pred: ast.BetweenPred): void {
        using _ = this._precedenceStack.with(Precedence.COMPARISON);
        pred.expr.accept(this);
        this._compositeStack.current.add(" between ");
        pred.minExpr.accept(this);
        this._compositeStack.current.add(" and ");
        pred.maxExpr.accept(this);
    }

    visitLikePred(pred: ast.LikePred): void {
        this._nodeRender.renderLikePred(pred, this._nodeRenderContext);
    }

    visitNullityPred(pred: ast.NullityPred): void {
        using _ = this._precedenceStack.with(Precedence.UNARY);
        pred.expr.accept(this);
        if (pred.neg) {
            this._compositeStack.current.add(" is not null");
        } else {
            this._compositeStack.current.add(" is null");
        }
    }

    visitCompoundPred(pred: ast.CompoundPred): void {
        using _ = this._compositeStack.with(new Scope(pred.op));
        using __ = this._precedenceStack.with(pred.op === "AND" ? Precedence.AND : Precedence.OR);
        const current = this._compositeStack.current;
        for (const p of pred.preds) {
            current.separator();
            p.accept(this);
        }
    }

    visitExistsPred(pred: ast.ExistsPred): void {
        using _ = this._precedenceStack.with(Precedence.UNARY);
        this._compositeStack.current.add(pred.neg ? " not exists" : "exists")
        pred.subQuery.accept(this);
    }

    visitFetchedView(fetchedView: ast.FetchedViewContract): void {
        const table = fetchedView.table;
        for (const field of fetchedView.view.mapper.fields) {
            if (field.columnIndex == null) {
                continue;
            }
            const column = field.prop.toStorage(this._strategy) as metadata.Column;
            this._compositeStack.current.separator();
            const realTable = this._toRealTable(table.__to(field.prop.declaringEntity));
            this._compositeStack.current.add(this._createColumn(realTable, column.name));
        }
    }

    visitTablePropExpr(expr: ast.PropExprContract): void {
        const column = expr.prop.toStorage(this._strategy) as metadata.Column;
        const realTable = this._toRealTable(expr.table);
        this._compositeStack.current.add(this._createColumn(realTable, column.name));
    }

    visitIsPred(pred: ast.IsPred): void {
        const realTable = this._toRealTable(pred.table);
        using _ = this._precedenceStack.with(Precedence.COMPARISON);
        addTypeMatch(realTable, pred.derivedEntity, this._createColumn, pred.neg, this._compositeStack.current);
    }

    visitCoalesceExpr(expr: ast.CoalesceExprContract): void {
        this._compositeStack.current.add("coalesce")
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
                current.add(part);
            } else {
                (part as ast.AbstractExpr<any>).accept(this);
            }
        }
    }

    visitSubQueryExpr(expr: ast.SubQueryExprContract): void {
        this._compositeStack.current.add(expr.op.toLowerCase());
        using _ = this._compositeStack.with(new Scope("VALUES"));
        expr.subQuery.accept(this);
    }

    visitShadowExpr(expr: ast.ShadowExprContract): void {
        const shadow = expr.shadow;
        if (shadow != null) {
            const realTable = this._toRealTable(shadow);
            this._compositeStack.current.add(new ShadowExpr(realTable, expr.anchor.exportedName));
        } else {
            (expr.anchor.original as any as ast.Node).accept(this);
        }
    }

    visitLowerExpr(expr: ast.LowerExpr): void {
        using _ = this._precedenceStack.with(Precedence.ROOT);
        const current = this._compositeStack.current;
        current.add("lower(");
        expr.expr.accept(this);
        current.add(")");
    }

    visitUpperExpr(expr: ast.UpperExpr): void {
        using _ = this._precedenceStack.with(Precedence.ROOT);
        const current = this._compositeStack.current;
        current.add("upper(");
        expr.expr.accept(this);
        current.add(")");
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
        current.add("replace(");
        expr.expr.accept(this);
        current.add(", ");
        expr.oldStrExpr.accept(this);
        current.add(", ");
        expr.newStrExpr.accept(this);
        current.add(")");
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
        this._compositeStack.current.add("-");
        expr.expr.accept(this);
    }

    visitBinaryNumExpr(expr: ast.BinaryNumExpr<any>): void {
        using _ = this._precedenceStack.with(
            expr.op === "+" || expr.op === "-"
                ? Precedence.PLUS
                : Precedence.TIMES
        );
        expr.leftExpr.accept(this);
        this._compositeStack.current.add(" ").add(expr.op).add(" ");
        expr.rightExpr.accept(this);
    }

    visitAggregateExpr(expr: ast.AggregateExpr<any>): void {
        using _ = this._precedenceStack.with(Precedence.ROOT);
        const current = this._compositeStack.current;
        current.add(expr.op.toLowerCase());
        current.add("(");
        if (expr.expr == null) {
            current.add("1");
        } else {
            expr.expr.accept(this);
        }
        current.add(")");
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

    visitConstant(value: number): void {
        this._compositeStack.current.add(value.toString());
    }

    private _visitProjection(projection: ast.ProjectionContract): void {
        switch (projection.kind) {
            case "ROOT_SINGLE":
                (projection.selection as any as ast.Node).accept(this);
                break;
            case "ROOT_ARRAY":
                for (const selection of projection.selections) {
                    this._compositeStack.current.separator();
                    (selection as any as ast.Node).accept(this);
                }
                break;
            case "ROOT_MAP":
                for (const key in projection.selections) {
                    this._compositeStack.current.separator();
                    (projection.selections[key] as any as ast.Node).accept(this);
                }
                break;
            case "SUB_SINGLE":
                (projection.selection as any as ast.Node).accept(this);
                break;
            case "SUB_ARRAY":
                for (const selection of projection.selections) {
                    this._compositeStack.current.separator();
                    (selection as any as ast.Node).accept(this);
                }
                break;
            case "BASE":
                for (const selection of this._baseQueryMetadata!.selections) {
                    this._compositeStack.current.separator();
                    if (selection.columnName == null) {
                        const expr = projection.args[selection.exportedName] as any as ast.ShadowExprContract;
                        expr.accept(this);
                        if (!this._baseQueryMetadata!.isCte) {
                            this._compositeStack.current.add(" ").add(selection.alias);
                        }
                    } else {
                        const table = projection.args[selection.exportedName] as metadata.AbstractEntityTable;
                        const realTable = this._toRealTable(table);
                        this._compositeStack.current.add(new Alias(realTable)).add(".").add(selection.columnName);
                        if (!this._baseQueryMetadata!.isCte) {
                            this._compositeStack.current.add(" ").add(selection.alias);
                        }
                    }
                }
                break;
        }
    }

    private _toRealTable(
        table: metadata.AbstractTable
    ): RealTable {
        if (table.__isPrev) {
            return this._baseQueryMetadata!.realTable;
        }
        return this._tableMap.get(table) ?? err.makeErr("No mapped real table");
    }

    private _createColumn(
        realTable: RealTable, 
        columnName: string
    ): Column {
        const shadow = realTable.shadow;
        if (shadow != null) {
            const exportedName = realTable.symbol.__anchor!.exportedName;
            if (shadow.symbol.__isPrev) {
                return new Column(this._baseQueryMetadata!.realTable, exportedName, columnName);
            }
            return new Column(shadow, exportedName, columnName);
        }
        return new Column(realTable, undefined, columnName);
    }

    toResult(): Composite {
        if (this._precedenceStack.size() !== 0) {
            throw new err.StateError("precedenceStack is not cleanup");
        }
        if (this._compositeStack.size() != 1) {
            throw new err.StateError("compositeStack is not cleanup");
        }
        return this._compositeStack.current as Composite;
    }

    private _fillTableFragments(tables: ReadonlyArray<RealTable>) {
        for (const table of tables) {
            if (table.symbol.__isCte) {
                table.cteDefinitionFragment = this._tableFragmentCreator.createDefinition(table);
            }
            table.fragment = this._tableFragmentCreator.createUsage(table);
            this._fillTableFragments(table.children);
        }
    }
}

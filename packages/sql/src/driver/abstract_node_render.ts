import { Precedence } from "@/sql/precedence";
import { NodeRender, NodeRenderContext, SingleColumnInCollectionPred } from "./node_render";
import { Scope, Value } from "@/sql/fragment";
import { err, spi } from "@ts-grm/core";

export abstract class AbstractNodeRender implements NodeRender {

    constructor(
        readonly driverName: string
    ) {}

    renderSingleColumnInCollectionPred(
        pred: SingleColumnInCollectionPred,
        ctx: NodeRenderContext
    ): void {
        using _ = ctx.withPrecedence(Precedence.COMPARISON);
        ctx.render(pred.expr);
        ctx.text(pred.neg ? " not in": " in");
        using __ = ctx.withComposite(new Scope("VALUES", false));
        for (const value of pred.values) {
            ctx.separator();
            ctx.render(value);
        }
    }

    renderLikePred(pred: spi.LikePred, ctx: NodeRenderContext): void {
        using _ = ctx.withPrecedence(Precedence.COMPARISON);
        if (pred.insensitive) {
            ctx.text("lower(");
            ctx.render(pred.expr);
            ctx.text(pred.neg ? ") not like ": ") like ");
        } else {
            ctx.render(pred.expr);
            ctx.text(pred.neg ? " not like " : " like ");
        }
        ctx.render(pred.pattern);
    }

    renderEsOpPred(
        pred: spi.EsOpPred,
        ctx: NodeRenderContext
    ): void {
        const provider = pred.expr.scalarProvider!;
        const flags = provider.toSql(pred.values) as any;
        const value = new Value(flags, pred.values);
        using _ = ctx.withPrecedence(Precedence.COMPARISON);
        ctx.text("(");
        ctx.render(pred.expr);
        ctx.text(" & ");
        ctx.render(value);
        ctx.text(")");
        switch (pred.op) {
            case "CONTAINS_ANY":
                ctx.text(" <> 0");
                break;
            case "NOT_CONTAINS_ANY":
                ctx.text(" = 0");
                break;
            case "CONTAINS_ALL":
                ctx.text(" = ");
                ctx.render(value);
                break;
            case "NOT_CONTAINS_ALL":
                ctx.text(" <> ");
                ctx.render(value);
                break;
        }
    }

    renderReverseExpr(expr: spi.ReverseExpr, ctx: NodeRenderContext): void {
        using _ = ctx.withPrecedence(Precedence.ROOT);
        ctx.text("reverse(");
        ctx.render(expr.expr);
        ctx.text(")");
    }

    renderTrimExpr(
        expr: spi.TrimExpr,
        ctx: NodeRenderContext
    ): void {
        using _ = ctx.withPrecedence(Precedence.ROOT);
        switch (expr.side) {
            case "LEFT":
                ctx.text("ltrim");
                break;
            case "RIGHT":
                ctx.text("rtrim");
                break;
            default:
                ctx.text("trim");
                break;
        }
        ctx.text("(");
        ctx.render(expr.expr);
        ctx.text(")");
    }

    renderLengthExpr(expr: spi.LengthExpr, ctx: NodeRenderContext): void {
        using _ = ctx.withPrecedence(Precedence.ROOT);
        ctx.text("length(cast(");
        ctx.render(expr.expr);
        ctx.text(" as text))");
    }

    renderPadExpr(expr: spi.PadExpr, ctx: NodeRenderContext): void {
        using _ = ctx.withPrecedence(Precedence.ROOT);
        ctx.text(expr.side === "LEFT" ? "lpad(" : "rpad(");
        ctx.render(expr.expr);
        ctx.text(", ");
        ctx.render(expr.lenExpr);
        ctx.text(", ");
        if (expr.padExpr != null) { 
            ctx.render(expr.padExpr);
        } else {
            ctx.text("' '");
        }
        ctx.text(")");
    }

    renderLeftExpr(
        expr: spi.LeftExpr,
        ctx: NodeRenderContext
    ): void {
        using _ = ctx.withPrecedence(Precedence.ROOT);
        ctx.text("substr(");
        ctx.render(expr.expr);
        ctx.text(", ");
        ctx.render(expr.lenExpr);
        ctx.text(")");
    }

    renderRightExpr(
        expr: spi.RightExpr,
        ctx: NodeRenderContext
    ): void {
        using _ = ctx.withPrecedence(Precedence.ROOT);
        ctx.text("substr(");
        ctx.render(expr.expr);
        ctx.text(", -");
        ctx.render(expr.lenExpr);
        ctx.text(")");
    }

    renderPositionExpr(
        expr: spi.PositionExpr,
        ctx: NodeRenderContext
    ): void {
        using _ = ctx.withPrecedence(Precedence.ROOT);
        ctx.text("instr(");
        ctx.render(expr.expr);
        ctx.text(", ");
        ctx.render(expr.substrExpr);
        ctx.text(")");
    }
    
    renderSubstringExpr(
        expr: spi.SubstringExpr,
        ctx: NodeRenderContext
    ): void {
        using _ = ctx.withPrecedence(Precedence.ROOT);
        ctx.text("substr(");
        ctx.render(expr.expr);
        ctx.text(", ");
        ctx.render(expr.startExpr);
        if (expr.lenExpr != null) {
            ctx.text(", ");
            ctx.render(expr.lenExpr);
        }
        ctx.text(")");
    }

    renderDtPlusExpr(
        expr: spi.DtPlusExpr,
        ctx: NodeRenderContext
    ): void {
        throw new Error("Unsupported Operation Exception");
    }

    renderDtDiffExpr(
        _expr: spi.DtDiffExpr,
        _ctx: NodeRenderContext
    ): void {
        throw new Error("Unsupported Operation Exception");
    }

    protected unsupportedFun(funName: string): never {
        throw new err.StateError(`The driver "${this.driverName}" does not support the function "${funName}"`);
    }
};
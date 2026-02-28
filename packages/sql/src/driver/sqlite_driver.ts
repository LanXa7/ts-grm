import { ast, err } from "@ts-grm/core";
import { Driver } from "./deriver";
import { NodeRender, NodeRenderContext } from "./fun_render";
import { Precedence } from "@/sql/precedence";

export class SqliteDriver implements Driver {

    readonly nodeRender: NodeRender = nodeRender;

    constructor() {}

    get name(): string {
        return "sqlite";
    }
}

const nodeRender = new class implements NodeRender {

    renderReverseExpr(_expr: ast.ReverseExpr, _ctx: NodeRenderContext): void {
        this._unsupported("reverse");
    }

    renderTrimExpr(
        expr: ast.TrimExpr,
        ctx: NodeRenderContext
    ): void {
        switch (expr.side) {
            case "LEFT":
                ctx.text("ltrim");
                break;
            case "RIGHT":
                ctx.text("ltrim");
                break;
            default:
                ctx.text("trim");
                break;
        }
        ctx.text("(");
        using _ = ctx.withPrecedence(Precedence.ROOT);
        ctx.render(expr.expr);
        ctx.text(")");
    }

    renderLengthExpr(expr: ast.LengthExpr, ctx: NodeRenderContext): void {
        ctx.text("length(cast(");
        using _ = ctx.withPrecedence(Precedence.ROOT);
        ctx.render(expr.expr);
        ctx.text(" as text))");
    }

    renderPadExpr(_expr: ast.PadExpr, _ctx: NodeRenderContext): void {
        this._unsupported("pad");
    }

    renderLeftExpr(
        expr: ast.LeftExpr,
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
        expr: ast.RightExpr,
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
        expr: ast.PositionExpr,
        ctx: NodeRenderContext
    ): void {
        if (expr.startExpr != null) {
            throw new err.StateError(`The sqlite does not support the argument "start" of function "position"`);
        }
        using _ = ctx.withPrecedence(Precedence.ROOT);
        ctx.text("instr(");
        ctx.render(expr.expr);
        ctx.text(", ");
        ctx.render(expr.substrExpr);
        ctx.text(")");
    }
    
    renderSubstringExpr(
        expr: ast.SubstringExpr,
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
        _expr: ast.DtPlusExpr,
        _ctx: NodeRenderContext
    ): void {
        throw new Error("Unsupported Operation Exception");
    }

    renderDtDiffExpr(
        _expr: ast.DtDiffExpr,
        _ctx: NodeRenderContext
    ): void {
        throw new Error("Unsupported Operation Exception");
    }

    private _unsupported(funName: string): void {
        throw new err.StateError(`The sqlite does not support the function "${funName}"`);
    }
};
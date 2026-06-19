import { ast, err } from "@ts-grm/core";
import { Driver } from "./deriver";
import { NodeRender, NodeRenderContext, SingleColumnInCollectionPred } from "./node_render";
import { Precedence } from "@/sql/precedence";
import { Scope } from "@/sql/fragment";
import { ColumnDef } from "@/impl/schema_def";
import { TransactionManager } from "@/transaction/transaction_manger";
import { SqliteTransactionManager } from "@/transaction/sqlite_transaction_manager";
import { Database } from "better-sqlite3";

export class SqliteDriver implements Driver {

    readonly nodeRender: NodeRender = nodeRender;

    readonly transactionManager: TransactionManager;

    constructor(readonly database: Database) {
        this.transactionManager = new SqliteTransactionManager(database);
    }

    get name(): string {
        return "sqlite";
    }

    get nameParameterPrefix(): string | undefined {
        return undefined;
    }

    get isRecursiveKeywordRequired() {
        return true;
    }

    typeName(columnDef: ColumnDef): string {
        switch (columnDef.type.kind) {
            case "BOOL":
            case "I8":
            case "I16":
            case "I16":
            case "I32":
            case "I64":
                return "integer";
            case "NUM":
                return "real";
            case "STR":
                return "text";
            case "BINARY":
                return "blob";
            default:
                throw new err.StateError(`Unsuported scalar type: ${columnDef.type.kind}`);
        }
    }

    get requiresInlineConstraints(): boolean {
        return true;
    }

    quoteIdentifier(value: string): string {
        if (KEYWORDS.has(value.toLowerCase())) {
            return `"${value}"`;
        }
        return value;
    }
}

const nodeRender = new class implements NodeRender {

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

    renderLikePred(pred: ast.LikePred, ctx: NodeRenderContext): void {
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

const KEYWORDS = new Set<string>([

    "select", "from", "where", "group", "by", "having", "order", "limit", "offset",
    "insert", "update", "delete", "into", "values", "set", "create", "table", "drop",
    "alter", "add", "column", "rename", "to", "view", "trigger",

    "and", "or", "not", "in", "is", "null", "like", "glob", "match", "regexp",
    "between", "exists", "case", "when", "then", "else", "end",

    "join", "left", "outer", "inner", "cross", "natural", "on", "using",
    "union", "all", "intersect", "except",

    "primary", "key", "foreign", "references", "unique", "check", "default", 
    "constraint", "collate", "on", "conflict", "do", "nothing", "nothing",

    "begin", "transaction", "commit", "rollback", "savepoint", "release",
    "as", "distinct", "all", "exists", "cast", "with", "recursive",

    "virtual", "indexed", "by", "escape", "deferrable", "initially", "deferred", "immediate"
])
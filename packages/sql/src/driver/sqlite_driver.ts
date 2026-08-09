import { err, spi, TimeUnit } from "@ts-grm/core";
import { NodeRender, NodeRenderContext } from "./node_render";
import { ColumnDef } from "@/impl/schema_def";
import { TransactionManager } from "@/transaction/transaction_manger";
import { SqliteTransactionManager } from "@/transaction/sqlite_transaction_manager";
import { Database } from "better-sqlite3";
import { Driver } from "./deriver";
import { AbstractNodeRender } from "./abstract_node_render";
import { Precedence } from "@/sql/precedence";
import { MetadataError } from "@/error/metadata_error";

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
                throw new MetadataError(`Unsuported scalar type: ${columnDef.type.kind}`);
        }
    }

    get requiresInlineConstraints(): boolean {
        return true;
    }

    get isTableCascadeDeletionSupported(): boolean {
        return false;
    }

    quoteIdentifier(value: string): string {
        if (keywords.has(value.toLowerCase())) {
            return `"${value}"`;
        }
        return value;
    }
}

const nodeRender = new class extends AbstractNodeRender {

    constructor() {
        super("Sqlite");
    }

    override renderReverseExpr(_expr: spi.ReverseExpr, _ctx: NodeRenderContext): void {
        this.unsupportedFun("reverse");
    }

    override renderPadExpr(_expr: spi.PadExpr, _ctx: NodeRenderContext): void {
        this.unsupportedFun("pad");
    }

    override renderPositionExpr(expr: spi.PositionExpr, ctx: NodeRenderContext): void {
        if (expr.startExpr != null) {
            throw new err.StateError(`The sqlite does not support the argument "start" of function "position"`);
        }
        super.renderPositionExpr(expr, ctx);
    }

    override renderDtPlusExpr(
        expr: spi.DtPlusExpr, 
        ctx: NodeRenderContext
    ): void {

        let value = expr.neg ? -expr.value : expr.value;
        const unit = expr.unit;
        
        let finalUnit = unitMap[unit];
        let absValue = Math.abs(value);
        
        if (unit === "WEEKS") {
            absValue = Math.abs(value * 7);
            finalUnit = "days";
        } else if (unit === "QUARTERS") {
            absValue = Math.abs(value * 3);
            finalUnit = "months";
        } else if (unit === "DECADES") {
            absValue = Math.abs(value * 10);
            finalUnit = "years";
        } else if (unit === "CENTURIES") {
            absValue = Math.abs(value * 100);
            finalUnit = "years";
        } else if (unit === "NANOSECONDS") {
            absValue = Math.abs(value / 1000000000);
            finalUnit = "seconds";
        } else if (unit === "MICROSECONDS") {
            absValue = Math.abs(value / 1000000);
            finalUnit = "seconds";
        } else if (unit === "MILLISECONDS") {
            absValue = Math.abs(value / 1000);
            finalUnit = "seconds";
        }
        
        using _ = ctx.withPrecedence(Precedence.ROOT);
        ctx.text("datetime(");
        ctx.render(expr.expr);
        ctx.text(", '");
        ctx.text(value < 0 ? "-" : "+");
        ctx.text(absValue.toString());
        ctx.text(" ");
        ctx.text(finalUnit);
        ctx.text("')");
    }

    override renderDtDiffExpr(
        expr: spi.DtDiffExpr, 
        ctx: NodeRenderContext
    ): void {

        const unit = expr.unit;
        let multiplier: number | undefined = undefined;
        let divisor: number | undefined = undefined;
        switch (unit) {
            case "NANOSECONDS": 
                multiplier = 86400000000000; 
                break;
            case "MICROSECONDS": 
                multiplier = 86400000000; 
                break;
            case "MILLISECONDS": 
                multiplier = 86400000; 
                break;
            case "SECONDS": 
                multiplier = 86400; 
                break;
            case "MINUTES": 
                multiplier = 1440; 
                break;
            case "HOURS": 
                multiplier = 24; 
                break;
            case "WEEKS": 
                divisor = 7.0; 
                break;
            case "MONTHS": 
                divisor = 30.4375; 
                break;
            case "QUARTERS": 
                divisor = 91.3125; 
                break;
            case "YEARS": 
                divisor = 365.25; 
                break;
            case "DECADES": 
                divisor = 3652.5; 
                break;
            case "CENTURIES": 
                divisor = 36525; 
                break;
        }
        if (multiplier != null) {
            using _ = ctx.withPrecedence(Precedence.TIMES);
            this._renderDtDiffExprImpl(expr, ctx);
            ctx.text(" * ");
            ctx.text(multiplier.toString());
        } else if (divisor != null) {
            using _ = ctx.withPrecedence(Precedence.TIMES);
            this._renderDtDiffExprImpl(expr, ctx);
            ctx.text(" / ");
            ctx.text(divisor.toString());
        } else {
            this._renderDtDiffExprImpl(expr, ctx);
        }
    }

    private _renderDtDiffExprImpl(
        expr: spi.DtDiffExpr, 
        ctx: NodeRenderContext
    ): void {
        using _ = ctx.withPrecedence(Precedence.PLUS);
        using __ = ctx.withPrecedence(Precedence.ROOT);
        ctx.text("JULIANDAY(");
        ctx.render(expr.expr);
        ctx.text(") - JULIANDAY(");
        ctx.render(expr.valueExpr);
        ctx.text(")");
    }
};

const unitMap: Record<TimeUnit, string> = {
    "NANOSECONDS": "seconds",
    "MICROSECONDS": "seconds",
    "MILLISECONDS": "seconds",
    "SECONDS": "seconds",
    "MINUTES": "minutes",
    "HOURS": "hours",
    "DAYS": "days",
    "WEEKS": "days",
    "MONTHS": "months",
    "QUARTERS": "months",
    "YEARS": "years",
    "DECADES": "years",
    "CENTURIES": "years"
};

const keywords = new Set<string>([

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
]);
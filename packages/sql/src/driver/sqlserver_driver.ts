import { spi, TimeUnit } from "@ts-grm/core";
import { AbstractNodeRender } from "./abstract_node_render";
import { NodeRenderContext } from "./node_render";
import { Precedence } from "@/sql/precedence";
import { UnsupportedFeatureError } from "@/error/unsupported_feature_error";

const nodeRender = new class extends AbstractNodeRender {

    constructor() {
        super("SqlServer");
    }

    override renderDtPlusExpr(
        expr: spi.DtPlusExpr, 
        ctx: NodeRenderContext
    ): void {
        
        let value = expr.neg ? -expr.value : expr.value;
        const unit = expr.unit;
        
        if (unit === "DECADES") {
            value = value * 10;
        } else if (unit === "CENTURIES") {
            value = value * 100;
        }
        
        if (!Number.isInteger(value)) {
            throw new UnsupportedFeatureError(`SQL Server does not support fractional time units: ${value} ${unit}`);
        }
        
        const finalUnit = unit === "DECADES" || unit === "CENTURIES" 
            ? "year" 
            : unitMap[unit];
        
        using _ = ctx.withPrecedence(Precedence.ROOT);
        ctx.text("DATEADD(");
        ctx.text(finalUnit);
        ctx.text(", ");
        ctx.text(value.toString());
        ctx.text(", ");
        ctx.render(expr.expr);
        ctx.text(")");
    }

    override renderDtDiffExpr(
        expr: spi.DtDiffExpr, 
        ctx: NodeRenderContext
    ): void {

        let unit = expr.unit;
        let multiplier: number | undefined = undefined;
        let divisor: number | undefined = undefined;
     
        if (unit === "NANOSECONDS") {
            unit = "MICROSECONDS";
            multiplier = 1000;
        } else if (unit === "DECADES") {
            unit = "YEARS";
            divisor = 10;
        } else if (unit === "CENTURIES") {
            unit = "YEARS";
            divisor = 100;
        }
        
        if (multiplier !== undefined) {
            using _ = ctx.withPrecedence(Precedence.TIMES);
            this._renderDtDiffExpr(expr, ctx);
            ctx.text(" * ");
            ctx.text(multiplier.toString());
        } else if (divisor !== undefined) {
            using _ = ctx.withPrecedence(Precedence.TIMES);
            this._renderDtDiffExpr(expr, ctx);
            ctx.text(" / ");
            ctx.text(divisor.toString());
        } else {
            this._renderDtDiffExpr(expr, ctx);
        }
    }

    private _renderDtDiffExpr(
        expr: spi.DtDiffExpr, 
        ctx: NodeRenderContext
    ): void {
        using _ = ctx.withPrecedence(Precedence.ROOT);
        const finalUnit = unitMap[expr.unit];
        ctx.text("DATEDIFF(");
        ctx.text(finalUnit);
        ctx.text(", ");
        ctx.render(expr.valueExpr);
        ctx.text(", ");
        ctx.render(expr.expr);
        ctx.text(")");
    }
}

const unitMap: Record<TimeUnit, string> = {
    "NANOSECONDS": "nanosecond",
    "MICROSECONDS": "microsecond",
    "MILLISECONDS": "millisecond",
    "SECONDS": "second",
    "MINUTES": "minute",
    "HOURS": "hour",
    "DAYS": "day",
    "WEEKS": "week",
    "MONTHS": "month",
    "QUARTERS": "quarter",
    "YEARS": "year",
    "DECADES": "year",
    "CENTURIES": "year"
};
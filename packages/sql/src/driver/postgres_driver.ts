import { spi, TimeUnit } from "@ts-grm/core";
import { AbstractNodeRender } from "./abstract_node_render";
import { NodeRenderContext } from "./node_render";
import { Precedence } from "@/sql/precedence";

const nodeRender = new class extends AbstractNodeRender {

    constructor() {
        super("Postgres");
    }

    override renderDtPlusExpr(
        expr: spi.DtPlusExpr, 
        ctx: NodeRenderContext
    ): void {
        
        let value = expr.neg ? -expr.value : expr.value;
        const unit = expr.unit;
        
        let finalUnit = unitMap[unit];
        
        if (unit === "QUARTERS") {
            value = value * 3;
            finalUnit = "months";
        } else if (unit === "DECADES") {
            value = value * 10;
            finalUnit = "years";
        } else if (unit === "CENTURIES") {
            value = value * 100;
            finalUnit = "years";
        } else if (unit === "NANOSECONDS") {
            value = value / 1000;
            finalUnit = "microseconds";
        }
        
        const absValue = Math.abs(value);
        
        using _ = ctx.withPrecedence(Precedence.PLUS);
        ctx.render(expr.expr);
        ctx.text(" ");
        ctx.text(value < 0 ? "-" : "+");
        ctx.text(" INTERVAL '");
        ctx.text(absValue.toString());
        ctx.text(" ");
        ctx.text(finalUnit);
        ctx.text("'");
    }

    override renderDtDiffExpr(
        expr: spi.DtDiffExpr, 
        ctx: NodeRenderContext
    ): void {

        const unit = expr.unit;
        
        if (unit === "YEARS" || unit === "MONTHS" || unit === "QUARTERS" || 
            unit === "DECADES" || unit === "CENTURIES") {
            let divisor: number | undefined = undefined;
            switch (unit) {
                case "QUARTERS":
                    divisor = 3;
                    break;
                case "YEARS":
                    divisor = 12;
                    break;
                case "DECADES":
                    divisor = 120;
                    break;
                case "CENTURIES":
                    divisor = 1200;
                    break;
            }
            if (divisor != undefined) {
                using _ = ctx.withPrecedence(Precedence.TIMES);
                this._renderYearDiffExpr(expr, ctx);
                ctx.text(" / ");
                ctx.text(divisor.toString());
            } else {
                this._renderYearDiffExpr(expr, ctx);
            }
        } else {
            let divisor: number | undefined = undefined;
            switch (unit) {
                case "NANOSECONDS": 
                    divisor = 1000000000; 
                    break;
                case "MICROSECONDS": 
                    divisor = 1000000; 
                    break;
                case "MILLISECONDS": 
                    divisor = 1000; 
                    break;
                case "MINUTES": 
                    divisor = 60; 
                    break;
                case "HOURS": 
                    divisor = 3600; 
                    break;
                case "DAYS": 
                    divisor = 86400; 
                    break;
                case "WEEKS": 
                    divisor = 604800; 
                    break;
            }
            if (divisor != null) {
                using _ = ctx.withPrecedence(Precedence.TIMES);
                this._renderSecondDiffExpr(expr, ctx);
                ctx.text(" / ");
                ctx.text(divisor.toString());
            } else {
                this._renderSecondDiffExpr(expr, ctx);
            }
        }
    }

    private _renderYearDiffExpr(
        expr: spi.DtDiffExpr, 
        ctx: NodeRenderContext
    ): void {
        using _ = ctx.withPrecedence(Precedence.PLUS);
        using __ = ctx.withPrecedence(Precedence.ROOT);
        ctx.text("(extract(year from ");
        ctx.render(expr.expr); 
        ctx.text(") - extract(year from ");
        ctx.render(expr.valueExpr);
        ctx.text(")) * 12 + extract(month from ");
        ctx.render(expr.expr);
        ctx.text(") - extract(month from ");
        ctx.render(expr.valueExpr);
        ctx.text(")");
    }

    private _renderSecondDiffExpr(
        expr: spi.DtDiffExpr, 
        ctx: NodeRenderContext
    ): void {
        using _ = ctx.withPrecedence(Precedence.PLUS);
        using __ = ctx.withPrecedence(Precedence.ROOT);
        ctx.text("extract(epoch from ");
        ctx.render(expr.expr);
        ctx.text(" - ");
        ctx.render(expr.valueExpr);
        ctx.text(")");
    }
};

const unitMap: Record<TimeUnit, string> = {
    "NANOSECONDS": "microseconds",
    "MICROSECONDS": "microseconds",
    "MILLISECONDS": "milliseconds",
    "SECONDS": "seconds",
    "MINUTES": "minutes",
    "HOURS": "hours",
    "DAYS": "days",
    "WEEKS": "weeks",
    "MONTHS": "months",
    "QUARTERS": "months",
    "YEARS": "years",
    "DECADES": "years",
    "CENTURIES": "years"
};
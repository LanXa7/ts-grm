import { spi, TimeUnit } from "@ts-grm/core";
import { AbstractNodeRender } from "./abstract_node_render";
import { NodeRenderContext } from "./node_render";
import { Precedence } from "@/sql/precedence";

const nodeRender = new class extends AbstractNodeRender {

    constructor() {
        super("Oracle");
    }

    override renderDtPlusExpr(expr: spi.DtPlusExpr, ctx: NodeRenderContext): void {
        
        let value = expr.neg ? -expr.value : expr.value;
        const unit = expr.unit;
        
        if (unit === "MONTHS" || unit === "YEARS" || unit === "QUARTERS" 
            ||  unit === "DECADES" || unit === "CENTURIES"
        ) {
            let months = value;
            if (unit === "QUARTERS") {
                months = value * 3
            } else if (unit === "YEARS") {
                months = value * 12;
            } else if (unit === "DECADES") {
                months = value * 120;
            } else if (unit === "CENTURIES") {
                months = value * 1200;
            }

            using _ = ctx.withPrecedence(Precedence.PLUS);
            ctx.render(expr.expr);
            ctx.text(" ");
            ctx.text(months < 0 ? "-" : "+");
            ctx.text(" NUMTOYMINTERVAL(");
            ctx.text(Math.abs(months).toString());
            ctx.text(", 'MONTH')");
        } else {
            let seconds = value;
            if (unit === "DAYS") {
                seconds = value * 86400;
            } else if (unit === "HOURS") {
                seconds = value * 3600;
            } else if (unit === "MINUTES") {
                seconds = value * 60;
            } else if (unit === "WEEKS") {
                seconds = value * 604800;
            } else if (unit === "MILLISECONDS") {
                seconds = value / 1000
            } else if (unit === "MICROSECONDS") { 
                seconds = value / 1000000;
            } else if (unit === "NANOSECONDS") {
                seconds = value / 1000000000;
            }

            using _ = ctx.withPrecedence(Precedence.PLUS);
            ctx.render(expr.expr);
            ctx.text(" ");
            ctx.text(seconds < 0 ? "-" : "+");
            ctx.text(" NUMTODSINTERVAL(");
            ctx.text(Math.abs(seconds).toString());
            ctx.text(", 'SECOND')");
        }
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
                divisor = 7; 
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
            this._renderDtDiffExpr(expr, ctx);
            ctx.text(" * ");
            ctx.text(multiplier.toString());
        } else if (divisor != null) {
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
        using _ = ctx.withPrecedence(Precedence.PLUS);
        ctx.render(expr.expr);
        ctx.text(" - ");
        ctx.render(expr.valueExpr);
    }
}
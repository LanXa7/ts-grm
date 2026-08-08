import { ArgumentError } from "@/error/common";
import { AbstractCmpExpr } from "./expr";
import { AbstractNumExpr } from "./num_expr";
import { TimeUnit } from "@/dsl/expression";
import { getInternalFactory } from "./internal_factory";
import type { CoalesceDtExpr } from "./coalesce_expr";
import { Visitor } from "./visitor";

export abstract class AbstractDtExpr extends AbstractCmpExpr<Date> {

    plus(
        value: number, 
        timeUnit: TimeUnit
    ): AbstractDtExpr {
        return new DtPlusExpr(
            this, 
            value,
            timeUnit,
            false
        );
    }

    minus(
        value: number, 
        timeUnit: TimeUnit
    ): AbstractDtExpr {
        return new DtPlusExpr(
            this,
            value,
            timeUnit,
            true
        );
    }

    diff(
        value: Date | AbstractDtExpr, 
        timeUnit: TimeUnit
    ): AbstractNumExpr<number> {
        return new DtDiffExpr(
            this,
            value instanceof Date ? getInternalFactory().createLiteral(value) : value,
            timeUnit
        );
    }

    override coalesce(
        values: ReadonlyArray<Date | AbstractDtExpr>
    ): CoalesceDtExpr {
        const factory = getInternalFactory();
        const arr = values.map(value => {
            if (value == null) {
                throw new ArgumentError("coalesce does not accept null/undefined value");
            }
            if (value instanceof AbstractDtExpr) {
                return value;
            }
            return factory.createLiteral(value);
        });
        return factory.createCoalesceDtExpr(this, arr);
    }
}

export class DtPlusExpr extends AbstractDtExpr {

    constructor(
        readonly expr: AbstractDtExpr,
        readonly value: number,
        readonly unit: TimeUnit,
        readonly neg: boolean
    ) {
        super();
    }

    accept(visitor: Visitor): void {
        visitor.visitDtPlusExpr(this);
    }
}

export class DtDiffExpr extends AbstractNumExpr<number> {

    constructor(
        readonly expr: AbstractDtExpr,
        readonly valueExpr: AbstractDtExpr,
        readonly unit: TimeUnit
    ) {
        super();
    }

    accept(visitor: Visitor): void {
        visitor.visitDtDiffExpr(this);
    }
}
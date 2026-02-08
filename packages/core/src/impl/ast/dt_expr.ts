import { ArgumentError } from "@/error/common";
import { AbstractCmpExpr } from "./expr";
import { AbstractNumExpr } from "./num_expr";
import { TimeUnit } from "@/dsl/expression";
import { getInternalFactory } from "./internal_factory";
import type { CoalesceDtExpr } from "./coalesce_expr";

export class AbstractDtExpr extends AbstractCmpExpr<Date> {

    plus(
        value: number | AbstractNumExpr<number>, 
        timeUnit: TimeUnit
    ): AbstractDtExpr {
        return new PlusExpr(
            this, 
            typeof value === "number" ? getInternalFactory().createLiteral(value) : value,
            timeUnit
        );
    }

    minus(
        value: number | AbstractNumExpr<number>, 
        timeUnit: TimeUnit
    ): AbstractDtExpr {
        return new MinusExpr(
            this,
            typeof value === "number" ? getInternalFactory().createLiteral(value) : value,
            timeUnit
        );
    }

    diff(
        value: Date | AbstractDtExpr, 
        timeUnit: TimeUnit
    ): AbstractNumExpr<number> {
        return new DiffExpr(
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

class PlusExpr extends AbstractDtExpr {

    constructor(
        readonly expr: AbstractDtExpr,
        readonly value: AbstractNumExpr<number>,
        readonly unit: TimeUnit
    ) {
        super();
    }
}

class MinusExpr extends AbstractDtExpr {

    constructor(
        readonly expr: AbstractDtExpr,
        readonly value: AbstractNumExpr<number>,
        readonly unit: TimeUnit
    ) {
        super();
    }
}

class DiffExpr extends AbstractNumExpr<number> {

    constructor(
        readonly expr: AbstractDtExpr,
        readonly value: AbstractDtExpr,
        readonly unit: TimeUnit
    ) {
        super();
    }
}
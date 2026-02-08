import { AbstractDtExpr } from "./dt_expr";
import { AbstractCmpExpr, AbstractExpr } from "./expr";
import { AbstractNumExpr } from "./num_expr";
import { AbstractStrExpr } from "./string_expr";

export class CoalesceExpr<T> extends AbstractExpr<T> {

    constructor(
        readonly expr: AbstractExpr<T>,
        readonly defaultExprs: ReadonlyArray<AbstractExpr<T>>
    ) {
        super();
    }
}

export class CoalesceCmpExpr<T> extends AbstractCmpExpr<T> {

    constructor(
        readonly expr: AbstractCmpExpr<T>,
        readonly defaultExprs: ReadonlyArray<AbstractCmpExpr<T>>
    ) {
        super();
    }
}

export class CoalesceNumExpr<T extends number | string> extends AbstractNumExpr<T> {

    constructor(
        readonly expr: AbstractNumExpr<T>,
        readonly defaultExprs: ReadonlyArray<AbstractNumExpr<T>>
    ) {
        super();
    }
}

export class CoalesceStrExpr extends AbstractStrExpr {

    constructor(
        readonly expr: AbstractStrExpr,
        readonly defaultExprs: ReadonlyArray<AbstractStrExpr>
    ) {
        super();
    }
}

export class CoalesceDtExpr extends AbstractDtExpr {

    constructor(
        readonly expr: AbstractDtExpr,
        readonly defaultExprs: ReadonlyArray<AbstractDtExpr>
    ) {
        super();
    }
}

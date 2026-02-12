import { AbstractDtExpr } from "./dt_expr";
import { AbstractCmpExpr, AbstractExpr } from "./expr";
import { AbstractNumExpr } from "./num_expr";
import { AbstractStrExpr } from "./string_expr";
import { Visitor } from "./visitor";

export interface CoalesceExprContract {
    readonly expr: AbstractExpr<any>,
    readonly defaultExprs: ReadonlyArray<AbstractExpr<any>>;
}

export class CoalesceExpr<T> extends AbstractExpr<T> implements CoalesceExprContract {

    constructor(
        readonly expr: AbstractExpr<T>,
        readonly defaultExprs: ReadonlyArray<AbstractExpr<T>>
    ) {
        super();
    }

    accept(visitor: Visitor): void {
        visitor.visitCoalesceExpr(this);
    }
}

export class CoalesceCmpExpr<T> extends AbstractCmpExpr<T> implements CoalesceExprContract {

    constructor(
        readonly expr: AbstractCmpExpr<T>,
        readonly defaultExprs: ReadonlyArray<AbstractCmpExpr<T>>
    ) {
        super();
    }

    accept(visitor: Visitor): void {
        visitor.visitCoalesceExpr(this);
    }
}

export class CoalesceNumExpr<T extends number | string> extends AbstractNumExpr<T> implements CoalesceExprContract {

    constructor(
        readonly expr: AbstractNumExpr<T>,
        readonly defaultExprs: ReadonlyArray<AbstractNumExpr<T>>
    ) {
        super();
    }

    accept(visitor: Visitor): void {
        visitor.visitCoalesceExpr(this);
    }
}

export class CoalesceStrExpr extends AbstractStrExpr implements CoalesceExprContract {

    constructor(
        readonly expr: AbstractStrExpr,
        readonly defaultExprs: ReadonlyArray<AbstractStrExpr>
    ) {
        super();
    }

    accept(visitor: Visitor): void {
        visitor.visitCoalesceExpr(this);
    }
}

export class CoalesceDtExpr extends AbstractDtExpr implements CoalesceExprContract {

    constructor(
        readonly expr: AbstractDtExpr,
        readonly defaultExprs: ReadonlyArray<AbstractDtExpr>
    ) {
        super();
    }

    accept(visitor: Visitor): void {
        visitor.visitCoalesceExpr(this);
    }
}

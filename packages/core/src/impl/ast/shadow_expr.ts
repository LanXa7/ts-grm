import { AbstractDtExpr } from "./dt_expr";
import { AbstractCmpExpr, AbstractExpr } from "./expr";
import { AbstractNumExpr } from "./num_expr";
import { ShadowAnchor } from "../shadow_anchor";
import { AbstractStrExpr } from "./string_expr";
import { Visitor } from "./visitor";

export interface ShadowExprContract {

    readonly anchor: ShadowAnchor;
}

export class ShadowExpr<T> extends AbstractExpr<T> implements ShadowExprContract {

    constructor(
        readonly anchor: ShadowAnchor
    ) {
        super();
    }

    accept(visitor: Visitor): void {
        visitor.visitShdowExpr(this);
    }
}

export class ShadowCmpExpr<T> extends AbstractCmpExpr<T> implements ShadowExprContract {

    constructor(
        readonly anchor: ShadowAnchor
    ) {
        super();
    }

    accept(visitor: Visitor): void {
        visitor.visitShdowExpr(this);
    }
}

export class ShadowNumExpr<T extends number | string> extends AbstractNumExpr<T> implements ShadowExprContract {

    constructor(
        readonly anchor: ShadowAnchor
    ) {
        super();
    }

    accept(visitor: Visitor): void {
        visitor.visitShdowExpr(this);
    }
}

export class ShadowStrExpr extends AbstractStrExpr implements ShadowExprContract {

    constructor(
        readonly anchor: ShadowAnchor
    ) {
        super();
    }

    accept(visitor: Visitor): void {
        visitor.visitShdowExpr(this);
    }
}

export class ShadowDtExpr extends AbstractDtExpr implements ShadowExprContract {

    constructor(
        readonly anchor: ShadowAnchor
    ) {
        super();
    }

    accept(visitor: Visitor): void {
        visitor.visitShdowExpr(this);
    }
}
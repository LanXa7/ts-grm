import { AbstractDtExpr } from "./dt_expr";
import { AbstractCmpExpr, AbstractExpr } from "./expr";
import { AbstractNumExpr } from "./num_expr";
import { ShadowAnchor } from "../shadow_anchor";
import { AbstractStrExpr } from "./str_expr";
import { Visitor } from "./visitor";
import { Node } from "./node";

export interface ShadowExprContract extends Node {

    readonly anchor: ShadowAnchor;
}

export class ShadowExpr<T> extends AbstractExpr<T> implements ShadowExprContract {

    constructor(
        readonly anchor: ShadowAnchor
    ) {
        super();
    }

    accept(visitor: Visitor): void {
        visitor.visitShadowExpr(this);
    }
}

export class ShadowCmpExpr<T> extends AbstractCmpExpr<T> implements ShadowExprContract {

    constructor(
        readonly anchor: ShadowAnchor
    ) {
        super();
    }

    accept(visitor: Visitor): void {
        visitor.visitShadowExpr(this);
    }
}

export class ShadowNumExpr<T extends number | string> extends AbstractNumExpr<T> implements ShadowExprContract {

    constructor(
        readonly anchor: ShadowAnchor
    ) {
        super();
    }

    accept(visitor: Visitor): void {
        visitor.visitShadowExpr(this);
    }
}

export class ShadowStrExpr extends AbstractStrExpr implements ShadowExprContract {

    constructor(
        readonly anchor: ShadowAnchor
    ) {
        super();
    }

    accept(visitor: Visitor): void {
        visitor.visitShadowExpr(this);
    }
}

export class ShadowDtExpr extends AbstractDtExpr implements ShadowExprContract {

    constructor(
        readonly anchor: ShadowAnchor
    ) {
        super();
    }

    accept(visitor: Visitor): void {
        visitor.visitShadowExpr(this);
    }
}
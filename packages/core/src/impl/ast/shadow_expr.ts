import { AbstractDtExpr } from "./dt_expr";
import { AbstractCmpExpr, AbstractExpr } from "./expr";
import { AbstractNumExpr } from "./num_expr";
import { ShadowAnchor } from "../shadow_anchor";
import { AbstractStrExpr } from "./str_expr";
import { Visitor } from "./visitor";
import { Node } from "./node";
import { TypedBaseTable } from "../base_table";
import { StateError } from "@/error/common";

export interface ShadowExprContract extends Node {

    readonly anchor: ShadowAnchor;

    readonly shadow: TypedBaseTable | undefined;

    __forShadow(shadow: TypedBaseTable): ShadowExprContract;
}

export class ShadowExpr<T> extends AbstractExpr<T> implements ShadowExprContract {

    private _shadow: TypedBaseTable | undefined = undefined;

    constructor(
        readonly anchor: ShadowAnchor
    ) {
        super();
    }

    get shadow(): TypedBaseTable | undefined {
        return this._shadow;
    }

    __forShadow(shadow: TypedBaseTable): ShadowExprContract {
        if (this._shadow === shadow) {
            return this;
        }
        const cloned = cloneShadowExpr(this, shadow);
        cloned._shadow = shadow;
        return cloned;
    }

    accept(visitor: Visitor): void {
        visitor.visitShadowExpr(this);
    }
}

export class ShadowCmpExpr<T> extends AbstractCmpExpr<T> implements ShadowExprContract {

    private _shadow: TypedBaseTable | undefined = undefined;

    constructor(
        readonly anchor: ShadowAnchor
    ) {
        super();
    }

    get shadow(): TypedBaseTable | undefined {
        return this._shadow;
    }

    __forShadow(shadow: TypedBaseTable): ShadowExprContract {
        if (this._shadow === shadow) {
            return this;
        }
        const cloned = cloneShadowExpr(this, shadow);
        cloned._shadow = shadow;
        return cloned;
    }

    accept(visitor: Visitor): void {
        visitor.visitShadowExpr(this);
    }
}

export class ShadowNumExpr<T extends number | string> extends AbstractNumExpr<T> implements ShadowExprContract {

    private _shadow: TypedBaseTable | undefined = undefined;

    constructor(
        readonly anchor: ShadowAnchor,
        isString: boolean
    ) {
        super(isString);
    }

    get shadow(): TypedBaseTable | undefined {
        return this._shadow;
    }

    __forShadow(shadow: TypedBaseTable): ShadowExprContract {
        if (this._shadow === shadow) {
            return this;
        }
        const cloned = cloneShadowExpr(this, shadow);
        cloned._shadow = shadow;
        return cloned;
    }

    accept(visitor: Visitor): void {
        visitor.visitShadowExpr(this);
    }
}

export class ShadowStrExpr extends AbstractStrExpr implements ShadowExprContract {

    private _shadow: TypedBaseTable | undefined = undefined;

    constructor(
        readonly anchor: ShadowAnchor
    ) {
        super();
    }

    get shadow(): TypedBaseTable | undefined {
        return this._shadow;
    }

    __forShadow(shadow: TypedBaseTable): ShadowExprContract {
        if (this._shadow === shadow) {
            return this;
        }
        const cloned = cloneShadowExpr(this, shadow);
        cloned._shadow = shadow;
        return cloned;
    }

    accept(visitor: Visitor): void {
        visitor.visitShadowExpr(this);
    }
}

export class ShadowDtExpr extends AbstractDtExpr implements ShadowExprContract {

    private _shadow: TypedBaseTable | undefined = undefined;

    constructor(
        readonly anchor: ShadowAnchor
    ) {
        super();
    }

    get shadow(): TypedBaseTable | undefined {
        return this._shadow;
    }

    __forShadow(shadow: TypedBaseTable): ShadowExprContract {
        if (this._shadow === shadow) {
            return this;
        }
        const cloned = cloneShadowExpr(this, shadow);
        cloned._shadow = shadow;
        return cloned;
    }

    accept(visitor: Visitor): void {
        visitor.visitShadowExpr(this);
    }
}

function cloneShadowExpr<T extends ShadowExprContract>(
    expr: T,
    shadow: TypedBaseTable
) {
    if (shadow.__baseModel !== expr.anchor?.baseModel) {
        throw new StateError(
            "Failed to create a clone expression for the shadow, " + 
            "because the model of the shadow anchor in the current expression " + 
            "differs from the model of the actual shadow"
        );
    }
    return Object.assign(Object.create(Object.getPrototypeOf(expr)), expr) as T;
}
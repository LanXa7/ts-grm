import { ArgumentError } from "@/error/common";
import { AbstractExpr } from "./expr";
import { AbstractNumExpr } from "./num_expr";
import { AbstractStrExpr } from "./str_expr";
import { AbstractDtExpr } from "./dt_expr";
import { Visitor } from "./visitor";

export function createLiteral(
    value: any,
    asNumber?: boolean
): AbstractExpr<any> {
    if (value == null) {
        throw new ArgumentError("The argument cannot be null");
    }
    switch (typeof value) {
        case "string":
            return asNumber == true 
                ? new LiteralNumExpr(value)
                : new LiteralStrExpr(value);
        case "number":
            return new LiteralNumExpr(value);
        default:
            if (value instanceof Date) {
                return new LiteralDtExpr(value);
            }
            return new LiteralExpr(value);
    }   
}

export interface ValueExprContract {
    readonly isConstant: boolean;
    readonly value: any;
}

class LiteralExpr<T> extends AbstractExpr<T> implements ValueExprContract {

    constructor(readonly value: T) {
        super();
    }

    get isConstant(): false {
        return false;
    }

    override get isValueExpr(): true {
        return true;
    }

    accept(visitor: Visitor): void {
        visitor.visitLiteral(this.value);
    }
}

class LiteralNumExpr<T extends number | string> extends AbstractNumExpr<T> implements ValueExprContract {

    constructor(readonly value: T) {
        super();
    }

    get isConstant(): false {
        return false;
    }

    override get isValueExpr(): true {
        return true;
    }

    accept(visitor: Visitor): void {
        visitor.visitLiteral(this.value);
    }
}

export class LiteralStrExpr extends AbstractStrExpr implements ValueExprContract {

    constructor(readonly value: string) {
        super();
    }

    get isConstant(): false {
        return false;
    }

    override get isValueExpr(): true {
        return true;
    }

    accept(visitor: Visitor): void {
        visitor.visitLiteral(this.value);
    }
}

export class LiteralDtExpr extends AbstractDtExpr implements ValueExprContract {

    constructor(readonly value: Date) {
        super();
    }

    get isConstant(): false {
        return false;
    }
    
    override get isValueExpr(): true {
        return true;
    }

    accept(visitor: Visitor): void {
        visitor.visitLiteral(this.value);
    }
}
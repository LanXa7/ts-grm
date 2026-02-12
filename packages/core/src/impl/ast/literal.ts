import { ArgumentError } from "@/error/common";
import { AbstractExpr } from "./expr";
import { AbstractNumExpr } from "./num_expr";
import { AbstractStrExpr } from "./string_expr";
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

class LiteralExpr<T> extends AbstractExpr<T> {

    constructor(readonly value: T) {
        super();
    }

    accept(visitor: Visitor): void {
        visitor.visitLiteral(this);
    }
}

class LiteralNumExpr<T extends number | string> extends AbstractNumExpr<T> {

    constructor(readonly value: T) {
        super();
    }

    accept(visitor: Visitor): void {
        visitor.visitLiteral(this);
    }
}

export class LiteralStrExpr extends AbstractStrExpr {

    constructor(readonly value: string) {
        super();
    }

    accept(visitor: Visitor): void {
        visitor.visitLiteral(this);
    }
}

export class LiteralDtExpr extends AbstractDtExpr {

    constructor(readonly value: Date) {
        super();
    }

    accept(visitor: Visitor): void {
        visitor.visitLiteral(this);
    }
}
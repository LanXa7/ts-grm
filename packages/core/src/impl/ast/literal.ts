import { ArgumentError } from "@/error/common";
import { AbstractExpr } from "./expr";
import { AbstractNumExpr } from "./num_expr";
import { AbstractStrExpr } from "./string_expr";

export function literal(value: boolean): AbstractExpr<boolean>;

export function literal(value: number): AbstractNumExpr<number>;

export function literal(value: string, asNumber: boolean): AbstractNumExpr<string>;

export function literal(value: string): AbstractStrExpr;

export function literal(
    value: any,
    asNumber?: boolean
): AbstractExpr<any> {
    if (value == null) {
        throw new ArgumentError("The argument cannot be null");
    }
    switch (typeof value) {
        case "string":
            return asNumber == true 
                ? new NumLiteralExpr(value)
                : new StrLiteralExpr(value);
        case "number":
            return new NumLiteralExpr(value);
        default:
            return new LiteralExpr(value);
    }   
}

class LiteralExpr<T> extends AbstractExpr<T> {

    constructor(readonly value: T) {
        super();
    }
}

class NumLiteralExpr<T extends number | string> extends AbstractNumExpr<T> {

    constructor(readonly value: T) {
        super();
    }
}

export class StrLiteralExpr extends AbstractStrExpr {

    constructor(readonly value: string) {
        super();
    }
}
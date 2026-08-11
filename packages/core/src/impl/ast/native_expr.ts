import { ExpressionLike } from "@/dsl/expression";
import { ExpressionOrder } from "@/dsl/utils";
import { AbstractExpr } from "./expr";
import { AbstractNumExpr } from "./num_expr";
import { Visitor } from "./visitor";
import { AbstractStrExpr } from "./str_expr";
import { AbstractDtExpr } from "./dt_expr";
import { NativeValueType } from "@/dsl/native";
import { getInternalFactory } from "./internal_factory";
import { NumericType } from "../numeric";

export interface NativeExprContract {

    readonly parts: ReadonlyArray<NativePart>;
}

export type NativePart = string | ExpressionLike | ReadonlyArray<ExpressionLike> | ReadonlyArray<ExpressionOrder>;

export function collectNativeParts(
    strings: TemplateStringsArray, 
    ...values: ReadonlyArray<NativeValueType>
): ReadonlyArray<NativePart> {
    const parts: Array<NativePart> = new Array(strings.length + values.length);
    const firstStr = strings[0]!;
    let cursor = 0;
    if (firstStr.length !== 0) {
        parts[cursor++] = firstStr;
    }
    for (let i = 0; i < values.length; i++) {
        const value = values[i]!;
        if (Array.isArray(value)) {
            parts[cursor++] = value;
        } else if (typeof value === "boolean") {
            parts[cursor++] = getInternalFactory().createLiteral(value);
        } else if (typeof value === "number") {
            parts[cursor++] = getInternalFactory().createLiteral(value);
        } else if (typeof value === "string") {
            parts[cursor++] = getInternalFactory().createLiteral(value);
        } else if (value instanceof Date) {
            parts[cursor++] = getInternalFactory().createLiteral(value);
        } else {
            parts[cursor++] = values[i]! as ExpressionLike;
        }
        const str = strings[i + 1]!;
        if (str.length !== 0) {
            parts[cursor++] = str;
        }
    }
    parts.length = cursor;
    return parts;
}

export class NativeExpr<T> extends AbstractExpr<T> implements NativeExprContract {

    accept(visitor: Visitor): void {
        visitor.visitNativeExpr(this);
    }

    constructor(readonly parts: ReadonlyArray<NativePart>) {
        super();
    }
}

export class NativeNumExpr<T extends string | number> extends AbstractNumExpr<T> implements NativeExprContract {

    accept(visitor: Visitor): void {
        visitor.visitNativeExpr(this);
    }

    constructor(
        readonly parts: ReadonlyArray<NativePart>,
        private readonly _numericType: NumericType
    ) {
        super();
    }

    override get numericType(): NumericType {
        return this._numericType;
    }
}

export class NativeStrExpr extends AbstractStrExpr implements NativeExprContract {

    accept(visitor: Visitor): void {
        visitor.visitNativeExpr(this);
    }

    constructor(readonly parts: ReadonlyArray<NativePart>) {
        super();
    }
}

export class NativeDtExpr extends AbstractDtExpr implements NativeExprContract {

    accept(visitor: Visitor): void {
        visitor.visitNativeExpr(this);
    }

    constructor(readonly parts: ReadonlyArray<NativePart>) {
        super();
    }
}

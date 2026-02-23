import { ExpressionLike } from "@/dsl";
import { AbstractExpr } from "./expr";
import { AbstractNumExpr } from "./num_expr";
import { Visitor } from "./visitor";
import { AbstractStrExpr } from "./string_expr";
import { AbstractDtExpr } from "./dt_expr";

export interface NativeExprContract {

    readonly parts: ReadonlyArray<NativePart>;
}

export type NativePart = string | ExpressionLike;

export function collectNativeParts(
    strings: TemplateStringsArray, 
    ...values: ReadonlyArray<ExpressionLike>
): ReadonlyArray<NativePart> {
    const parts: Array<NativePart> = new Array(strings.length + values.length);
    const firstStr = strings[0]!;
    let cursor = 0;
    if (firstStr.length !== 0) {
        parts[cursor++] = firstStr;
    }
    for (let i = 0; i < values.length; i++) {
        parts[cursor++] = values[i]!;
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

    constructor(readonly parts: ReadonlyArray<NativePart>) {
        super();
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

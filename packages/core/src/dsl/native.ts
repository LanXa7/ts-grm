import { collectNativeParts, NativeDtExpr, NativeNumExpr, NativeStrExpr } from "@/impl/ast/native_expr";
import { Expression, ExpressionLike } from "./expression";
import { ExpressionOrder } from "./utils";

export type NativeValueType = 
    ExpressionLike 
    | boolean 
    | number 
    | boolean 
    | Date 
    | ReadonlyArray<ExpressionLike> 
    | ReadonlyArray<ExpressionOrder>;

export type NativeNumCreator = {
    (
        strings: TemplateStringsArray, 
        ...values: ReadonlyArray<NativeValueType>
    ): Expression<number, "">;

    asString(
        strings: TemplateStringsArray, 
        ...values: ReadonlyArray<NativeValueType>
    ): Expression<string, "AS_NUMBER">;
}

function num(
    strings: TemplateStringsArray, 
    ...values: ReadonlyArray<NativeValueType>
) {
    return new NativeNumExpr<number>(
        collectNativeParts(strings, ...values)
    ) as any as Expression<number, "">;
}

function numAsString(
    strings: TemplateStringsArray, 
    ...values: ReadonlyArray<NativeValueType>
) {
    return new NativeNumExpr<string>(
        collectNativeParts(strings, ...values)
    ) as any as Expression<string, "">;
}

(num as any).asString = numAsString;

function str(
    strings: TemplateStringsArray, 
    ...values: ReadonlyArray<NativeValueType>
) {
    return new NativeStrExpr(
        collectNativeParts(strings, ...values)
    ) as any as Expression<string, "">;
}

function date(
    strings: TemplateStringsArray, 
    ...values: ReadonlyArray<NativeValueType>
): Expression<Date, ""> {
    return new NativeDtExpr(
        collectNativeParts(strings, ...values)
    ) as any as Expression<Date, "">;
}

export const native = {
    num: num as NativeNumCreator,
    str,
    date
};
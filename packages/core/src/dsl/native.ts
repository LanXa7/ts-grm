import { collectNativeParts, NativeDtExpr, NativeNumExpr, NativeStrExpr } from "@/impl/ast/native_expr";
import { DateExpression, ExpressionLike, NumExpression, StrExpression } from "./expression";
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
    ): NumExpression<number>;

    asString(
        strings: TemplateStringsArray, 
        ...values: ReadonlyArray<NativeValueType>
    ): NumExpression<string>;
}

function num(
    strings: TemplateStringsArray, 
    ...values: ReadonlyArray<NativeValueType>
) {
    return new NativeNumExpr<number>(
        collectNativeParts(strings, ...values)
    ) as any as NumExpression<number>;
}

function numAsString(
    strings: TemplateStringsArray, 
    ...values: ReadonlyArray<NativeValueType>
) {
    return new NativeNumExpr<string>(
        collectNativeParts(strings, ...values)
    ) as any as NumExpression<string>;
}

(num as any).asString = numAsString;

function str(
    strings: TemplateStringsArray, 
    ...values: ReadonlyArray<NativeValueType>
) {
    return new NativeStrExpr(
        collectNativeParts(strings, ...values)
    ) as any as StrExpression<string>;
}

function date(
    strings: TemplateStringsArray, 
    ...values: ReadonlyArray<NativeValueType>
): DateExpression<Date> {
    return new NativeDtExpr(
        collectNativeParts(strings, ...values)
    ) as any as DateExpression<Date>;
}

export const native = {
    num: num as NativeNumCreator,
    str,
    date
};
import { collectNativeParts, NativeDtExpr, NativeNumExpr, NativeStrExpr } from "@/impl/ast/native_expr";
import { Expression, ExpressionLike } from ".";

type NativeNumCreator = {
    (
        strings: TemplateStringsArray, 
        ...values: ReadonlyArray<ExpressionLike>
    ): Expression<number>;

    asString(
        strings: TemplateStringsArray, 
        ...values: ReadonlyArray<ExpressionLike>
    ): Expression<number>;
}

function num(
    strings: TemplateStringsArray, 
    ...values: ReadonlyArray<ExpressionLike>
) {
    return new NativeNumExpr<number>(
        collectNativeParts(strings, ...values)
    ) as any as Expression<number>;
}

function numAsString(
    strings: TemplateStringsArray, 
    ...values: ReadonlyArray<ExpressionLike>
) {
    return new NativeNumExpr<string>(
        collectNativeParts(strings, ...values)
    ) as any as Expression<string>;
}

(num as any).asString = numAsString;

function str(
    strings: TemplateStringsArray, 
    ...values: ReadonlyArray<ExpressionLike>
) {
    return new NativeStrExpr(
        collectNativeParts(strings, ...values)
    ) as any as Expression<string>;
}

function date(
    strings: TemplateStringsArray, 
    ...values: ReadonlyArray<ExpressionLike>
): Expression<Date> {
    return new NativeDtExpr(
        collectNativeParts(strings, ...values)
    ) as any as Expression<Date>;
}

export const native = {
    num: num as NativeNumCreator,
    str,
    date
};
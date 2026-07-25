import { NumExpression } from "@/dsl/expression";
import { __MergeNumType } from "@/index_internal";
import { expectTypeOf, it, describe } from "vitest";

describe("ExpressionTest", () => {

    function undefinedNumExpr(): NumExpression<number | undefined> {
        throw new Error();
    }

    function nullOrUndefinedNumber(): NumExpression<number | null | undefined> {
        throw new Error();
    }

    function nonNullNumExpr(): NumExpression<number> {
        throw new Error();
    }

    function undefinedLargeNumExpr(): NumExpression<string | undefined> {
        throw new Error();
    }

    function nonNullLargeNumExpr(): NumExpression<string> {
        throw new Error();
    }

    it("TestNumber", () => {

        const a = undefinedLargeNumExpr().plus(nonNullNumExpr());
        expectTypeOf<typeof a>().toEqualTypeOf<NumExpression<string | null>>();
        
        const b = nonNullLargeNumExpr().plus(undefinedNumExpr());
        expectTypeOf<typeof b>().toEqualTypeOf<NumExpression<string | null>>();

        const c = nonNullLargeNumExpr().plus(nonNullNumExpr());
        expectTypeOf<typeof c>().toEqualTypeOf<NumExpression<string>>();

        const d = undefinedNumExpr().plus(nonNullNumExpr());
        expectTypeOf<typeof d>().toEqualTypeOf<NumExpression<number | null>>();

        const e = nonNullNumExpr().plus(undefinedNumExpr());
        expectTypeOf<typeof e>().toEqualTypeOf<NumExpression<number | null>>();

        const f = nonNullNumExpr().plus(nonNullNumExpr());
        expectTypeOf<typeof f>().toEqualTypeOf<NumExpression<number>>();

        const g = nonNullNumExpr().plus(nullOrUndefinedNumber());
        expectTypeOf<typeof g>().toEqualTypeOf<NumExpression<number | null>>();
    });

    it("TestCoalesc", () => {
        
        const a = undefinedNumExpr().coalesce(undefinedNumExpr(), nonNullNumExpr());
        expectTypeOf<typeof a>().toEqualTypeOf<NumExpression<number>>();

        const b = undefinedNumExpr().coalesce(undefinedNumExpr(), nullOrUndefinedNumber());
        expectTypeOf<typeof b>().toEqualTypeOf<NumExpression<number | null>>();

        const c = undefinedNumExpr().coalesce(undefinedNumExpr(), 3);
        expectTypeOf<typeof c>().toEqualTypeOf<NumExpression<number>>();
    });
});

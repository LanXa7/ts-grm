import { NullityType } from "@/schema/prop";
import { CompilationError } from "@/utils"
import { ExpressionSubQuery } from "./sub_query";
import { AtLeastOne, ExpressionOrder } from "./utils";
import { AbstractStrExpr, ConcatExpr } from "@/impl/ast/str_expr";
import { ArgumentError } from "@/error/common";
import { getInternalFactory } from "@/impl/ast/internal_factory";
import { OrderNullsType } from "@/schema/order";
import { CompoundPred } from "@/impl/ast/pred";
import { ConstantExpr } from "@/impl/ast/constant";

export type Expression<
    T, 
    TAsNumber extends AsNumberBound<T> = ""
> = 
    NonNull<T> extends string
        ? TAsNumber extends "AS_NUMBER"
            ? NumExpression<T & Nullable<string>>
            : StrExpression<T & Nullable<string>>
    : NonNull<T> extends Date
        ? DateExpression<T & Nullable<Date>>
    : NonNull<T> extends number
        ? NumExpression<T & Nullable<number>>
    : AnyExpression<T>;

export type AsNumberBound<T> = T extends string ? "AS_NUMBER" | "" : "";

export type Predicate = AnyExpression<boolean>;

type NonNull<T> = Exclude<T, null | undefined>;

type Nullable<T> = T | null | undefined;

type IsNull<T> = 
    null extends T
        ? true
    : undefined extends T
        ? true
    : false;

type AnyExpression<T, TAsNumber extends AsNumberBound<T> = ""> = {
    
    __type(): {
        selectionLike: true;
        expressionLike: true;
        expression: [T, TAsNumber] | true;
    };

    asc(nulls?: OrderNullsType): ExpressionOrder;

    desc(nulls?: OrderNullsType): ExpressionOrder;

    eq(
        value: RHSType<T, TAsNumber>
    ): AnyExpression<boolean>;
    
    ne(
        value: RHSType<T, TAsNumber>
    ): AnyExpression<boolean>;

    in<Values extends NonNullRHSType<T, TAsNumber>[]>(
        ...values: HasSubqueryInArray<Values> extends true 
            ? [SubqueryError]
            : Values
    ): AnyExpression<boolean>;

    inSubQuery(
        subQuery: ExpressionSubQuery<Expression<NonNull<T>, TAsNumber>>
    ): AnyExpression<boolean>;

    notIn<Values extends NonNullRHSType<T, TAsNumber>[]>(
        ...values: HasSubqueryInArray<Values> extends true 
            ? [SubqueryError]
            : Values
    ): AnyExpression<boolean>;

    notInSubQuery(
        subQuery: ExpressionSubQuery<Expression<NonNull<T>, TAsNumber>>
    ): AnyExpression<boolean>;
    
    eqIf(
        value: Nullable<T>
    ): AnyExpression<boolean> | undefined;
    
    neIf(
        value: Nullable<T>
    ): AnyExpression<boolean> | undefined;

    inIf(
        values: NonNull<T>[] | null | undefined
    ): AnyExpression<boolean> | undefined;

    notInIf(
        values: NonNull<T>[] | null | undefined
    ): AnyExpression<boolean> | undefined;
} & (
    IsNull<T> extends true
        ? { 
            isNull(): AnyExpression<boolean>;

            isNotNull(): AnyExpression<boolean>;

            coalesce<TArgs extends CoalesceArgs<T>>(
                ...exprs: TArgs
            ): Expression<CoalesceDataType<T, TArgs>, TAsNumber & AsNumberBound<CoalesceDataType<T, TArgs>>>;

            asNonNull(): Expression<NonNull<T>, TAsNumber>;
        }
        : object
);

type RHSType<T, TAsNumber extends AsNumberBound<T>> =
    NonNull<T> | AnyExpression<NonNull<T>, TAsNumber> | AnyExpression<Nullable<T>, TAsNumber> 
        | (
            TAsNumber extends "AS_NUMBER"
                ? number 
                    | AnyExpression<NonNull<number>, any> 
                    | AnyExpression<Nullable<number>, any>
                : never
        )
        | (
            T extends number
                ? AnyExpression<NonNull<string>, "AS_NUMBER">
                    | AnyExpression<Nullable<string>, "AS_NUMBER">
                : never
        );

type NonNullRHSType<T, TAsNumber extends AsNumberBound<T>> =
    NonNull<T> | AnyExpression<NonNull<T>, TAsNumber> 
        | (
            TAsNumber extends "AS_NUMBER"
                ? number | AnyExpression<NonNull<number>, any>
                : never
        )
        | (
            T extends number
                ? AnyExpression<NonNull<string>, "AS_NUMBER">
                : never
        );

type CoalesceArgs<T> =
    [
        ...AnyExpression<Nullable<T>>[],
        ...([] | [NonNull<T>] | [AnyExpression<NonNull<T>>])
    ];

type CoalesceDataType<T, TArgs extends any[]> =
    TArgs extends [...any[], infer TLast]
        ? TLast extends Expression<infer R>
            ? (
                IsNull<R> extends true
                    ? T | R
                    : NonNull<T>
            )
            : (
                IsNull<TLast> extends true
                    ? T | TLast
                    : NonNull<T>
            )
        : T;

type CmpExpression<
    T, 
    TAsNumber extends AsNumberBound<T> = ""
> = AnyExpression<T, TAsNumber> & {
    
    __type(): { 
        selectionLike: true;
        expressionLike: true;
        expression: T | undefined;
        cmpExpression: T | undefined;
    }
    
    lt(
        value: RHSType<T, TAsNumber>
    ): AnyExpression<boolean>;
    
    le(
        value: RHSType<T, TAsNumber>
    ): AnyExpression<boolean>;
    
    gt(
        value: RHSType<T, TAsNumber>
    ): AnyExpression<boolean>;
    
    ge(
        value: RHSType<T, TAsNumber>
    ): AnyExpression<boolean>;

    between(
        min: RHSType<T, TAsNumber>,
        max: RHSType<T, TAsNumber>
    ): AnyExpression<boolean>;
    
    ltIf(
        value: Nullable<T>
    ): AnyExpression<boolean> | undefined;
    
    leIf(
        value: Nullable<T>
    ): AnyExpression<boolean> | undefined;
    
    gtIf(
        value: Nullable<T>
    ): AnyExpression<boolean> | undefined;
    
    geIf(
        value: Nullable<T>
    ): AnyExpression<boolean> | undefined;

    betweenIf(
        min: Nullable<T>,
        max: Nullable<T>
    ): AnyExpression<boolean> | undefined;
}

type MergeNullableType<
    T1 extends Nullable<string | number>, 
    T2 extends Nullable<string | number>
> =
    string extends T1 | T2
        ? Exclude<T1 | T2, number> 
        : T1 | T2;

type NumExpression<
    T extends Nullable<string | number>
> = CmpExpression<T, NonNull<T> extends string ? "AS_NUMBER" : ""> & {

    __type(): { 
        selectionLike: true;
        expressionLike: true;
        expression: T | undefined;
        cmpExpression: T | undefined;
        numExpression: T | undefined;
    }

    unaryMinus(): NumExpression<T>;

    plus<X extends Nullable<string | number>>(
        value: NonNull<X> | NumExpression<X>
    ): NumExpression<MergeNullableType<T, X>>;

    minus<X extends Nullable<string | number>>(
        value: NonNull<X> | NumExpression<X>
    ): NumExpression<MergeNullableType<T, X>>;

    times<X extends Nullable<string | number>>(
        value: NonNull<X> | NumExpression<X>
    ): NumExpression<MergeNullableType<T, X>>;

    div<X extends Nullable<string | number>>(
        value: NonNull<X> | NumExpression<X>
    ): NumExpression<MergeNullableType<T, X>>;

    rem<X extends Nullable<string | number>>(
        value: NonNull<X> | NumExpression<X>
    ): NumExpression<MergeNullableType<T, X>>;
}

export type LikeMode = "CONTAINS" | "STARTS_WITH" | "ENDS_WITH" | "EXACT";

type StrExpression<T extends Nullable<string>> = CmpExpression<T> & {

    __type(): { 
        selectionLike: true;
        expressionLike: true;
        expression: T | undefined;
        cmpExpression: T | undefined;
        numExpression: T | undefined;
        strExpression: T | undefined;
    }

    like(
        value: string, 
        mode?: LikeMode
    ): AnyExpression<boolean> | undefined;

    ilike(
        value: string, 
        mode?: LikeMode
    ): AnyExpression<boolean> | undefined;

    likeIf(
        value: Nullable<string>, 
        mode?: LikeMode
    ): AnyExpression<boolean> | undefined;

    ilikeIf(
        value: Nullable<string>, 
        mode?: LikeMode
    ): AnyExpression<boolean> | undefined;

    notLike(
        value: string, 
        mode?: LikeMode
    ): AnyExpression<boolean> | undefined;

    notIlike(
        value: string, 
        mode?: LikeMode
    ): AnyExpression<boolean> | undefined;

    notLikeIf(
        value: Nullable<string>, 
        mode?: LikeMode
    ): AnyExpression<boolean> | undefined;

    notIlikeIf(
        value: Nullable<string>, 
        mode?: LikeMode
    ): AnyExpression<boolean> | undefined;

    lower(): StrExpression<T>;

    upper(): StrExpression<T>;

    trim(): StrExpression<T>;

    ltrim(): StrExpression<T>;

    length(): NumExpression<number>;

    reverse(): StrExpression<T>;

    replace(oldStr: string, newStr: string): StrExpression<T>;

    lpad(
        length: number | NumExpression<number>, 
        pad?: string
    ): StrExpression<T>;

    rpad(
        length: number | NumExpression<number>, 
        pad?: string
    ): StrExpression<T>;

    left(
        length: number | NumExpression<number>
    ): StrExpression<T>;

    right(
        length: number | NumExpression<number>
    ): StrExpression<T>;

    position(
        substr: string, 
        start?: number | NumExpression<number>
    ): StrExpression<T>;

    substring(
        start: number | NumExpression<number>,
        length?: number | NumExpression<number>
    ): StrExpression<T>;
}

type DateExpression<T extends Nullable<Date>> = CmpExpression<T> & {
    
    plus(
        value: number | Expression<number>, 
        timeUnit: TimeUnit
    ): DateExpression<T>;

    minus(
        value: number | Expression<number>, 
        timeUnit: TimeUnit
    ): DateExpression<T>;

    diff(
        value: Date | DateExpression<any>, 
        timeUnit: TimeUnit
    ): NumExpression<number>;
};

export type TimeUnit = 
    "NANOSECONDS" 
    | "MICROSECONDS"
    | "MILLISECONDS"
    | "SECONDS"
    | "MINUTES"
    | "HOURS"
    | "DAYS"
    | "WEEKS"
    | "MONTHS"
    | "QUARTERS"
    | "YEARS"
    | "DECADES"
    | "CENTURIES";

export type MakeType<T, TNullity extends NullityType> =
    TNullity extends "NONNULL"
        ? T
        : T | null | undefined;

export function and(
    ...predicates: ReadonlyArray<Nullable<AnyExpression<boolean>>>
): AnyExpression<boolean> | undefined {
    return CompoundPred.of("AND", predicates) as AnyExpression<boolean> | undefined;
}

export function or(
    ...predicates: ReadonlyArray<Nullable<AnyExpression<boolean>>>
): AnyExpression<boolean> | undefined {
    return CompoundPred.of("OR", predicates) as AnyExpression<boolean> | undefined;
}

export function not(
    ...predicates: ReadonlyArray<Nullable<AnyExpression<boolean>>>
): AnyExpression<boolean> | undefined {
    return CompoundPred.of("AND", predicates)?.negative() as AnyExpression<boolean> | undefined;
}

export type ExpressionLike = {
    __type(): {
        expressionLike: true;
    }
};

export function constant(
    value: number
): Expression<number> {
    return new ConstantExpr(value) as any as Expression<number>;
}

export function concat(
    ...values: AtLeastOne<string | StrExpression<string>>
): StrExpression<string> {
    const arr = values.map(value => {
        if (value == null) {
            throw new ArgumentError("concat does not accept null/undefined value");
        }
        if (typeof value === "string") {
            return getInternalFactory().createLiteral(value);
        }
        return (value as any) as AbstractStrExpr;
    });
    throw new ConcatExpr(arr);
}

type SubqueryError = 
    CompilationError<`Cannot directly use subqueries in 'IN' expressions.
Either use the 'inSubQuery()' function for collection operations;
or use 'asValue()' to convert the subquery into a single value before using it.`>;

type HasSubqueryInArray<Arr extends any[]> = 
    Arr extends [infer First, ...infer Rest]
        ? First extends { __type(): { expressionSubQuery: any }; }
            ? true 
            : HasSubqueryInArray<Rest>
        : false;
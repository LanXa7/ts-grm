import { NullityType } from "@/schema/prop";
import { CompilationError, supressUnused } from "@/utils"
import { ExpressionSubQuery } from "./sub-query";
import { ExpressionOrder } from "./utils";

export type Expression<
    T, 
    TAsNumber extends "AS_NUMBER" | undefined = undefined
> = 
    NonNull<T> extends string
        ? TAsNumber extends "AS_NUMBER"
            ? NumExpression<T & Nullable<string>>
            : StrExpression<T & Nullable<string>>
    : NonNull<T> extends number
        ? NumExpression<T & Nullable<number>>
    : AnyExpression<T>;

export type Predicate = AnyExpression<boolean>;

type NonNull<T> = Exclude<T, null | undefined>;

type Nullable<T> = T | null | undefined;

type IsNull<T> = 
    null extends T
        ? true
    : undefined extends T
        ? true
    : false;

type AnyExpression<T> = {
    
    __type(): {
        selectionLike: true;
        expressionLike: true;
        expression: T | undefined;
    };

    asc(): ExpressionOrder;

    desc(): ExpressionOrder;

    eq(
        value: NonNull<T> | AnyExpression<NonNull<T>>
    ): AnyExpression<boolean>;
    
    ne(
        value: NonNull<T> | AnyExpression<NonNull<T>>
    ): AnyExpression<boolean>;

    in<Values extends (NonNull<T> | Expression<NonNull<T>>)[]>(
        ...values: HasSubqueryInArray<Values> extends true 
            ? [SubqueryError]
            : Values
    ): AnyExpression<boolean>;

    in<Values extends (NonNull<T> | Expression<NonNull<T>>)[]>(
        values: HasSubqueryInArray<Values> extends true 
            ? [SubqueryError]
            : Values
    ): AnyExpression<boolean>;

    inSubQuery(
        subQuery: ExpressionSubQuery<Expression<NonNull<T>>>
    ): AnyExpression<boolean>;

    notIn<Values extends (NonNull<T> | Expression<NonNull<T>>)[]>(
        ...values: HasSubqueryInArray<Values> extends true 
            ? [SubqueryError]
            : Values
    ): AnyExpression<boolean>;

    notIn<Values extends (NonNull<T> | Expression<NonNull<T>>)[]>(
        values: HasSubqueryInArray<Values> extends true 
            ? [SubqueryError]
            : Values
    ): AnyExpression<boolean>;

    notInSubQuery(
        subQuery: ExpressionSubQuery<Expression<NonNull<T>>>
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
            ): Expression<CoalesceDataType<T, TArgs>>;
        }
        : object
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

type CmpExpression<T> = AnyExpression<T> & {
    
    __type(): { 
        selectionLike: true;
        expression: T | undefined;
        cmpExpression: T | undefined;
    }
    
    lt(
        value: NonNull<T> | CmpExpression<T>
    ): AnyExpression<boolean>;
    
    le(
        value: NonNull<T> | CmpExpression<T>
    ): AnyExpression<boolean>;
    
    gt(
        value: NonNull<T> | CmpExpression<T>
    ): AnyExpression<boolean>;
    
    ge(
        value: NonNull<T> | CmpExpression<T>
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
}

type MergeNumType<
    T1 extends Nullable<string | number>, 
    T2 extends Nullable<string | number>
> =
    string extends T1 | T2
        ? Exclude<T1 | T2, number> 
        : T1 | T2;

type NumExpression<T extends Nullable<string | number>> = CmpExpression<T> & {

    __type(): { 
        selectionLike: true;
        expression: T | undefined;
        cmpExpression: T | undefined;
        numExpression: T | undefined;
    }

    unaryMinus(): NumExpression<T>;

    plus<X extends Nullable<string | number>>(
        value: NonNull<X> | NumExpression<X>
    ): NumExpression<MergeNumType<T, X>>;

    minus<X extends Nullable<string | number>>(
        value: NonNull<X> | NumExpression<X>
    ): NumExpression<MergeNumType<T, X>>;

    times<X extends Nullable<string | number>>(
        value: NonNull<X> | NumExpression<X>
    ): NumExpression<MergeNumType<T, X>>;

    div<X extends Nullable<string | number>>(
        value: NonNull<X> | NumExpression<X>
    ): NumExpression<MergeNumType<T, X>>;

    rem<X extends Nullable<string | number>>(
        value: NonNull<X> | NumExpression<X>
    ): NumExpression<MergeNumType<T, X>>;
}

export type LikeMode = "CONTAINS" | "STARTS_WITH" | "ENDS_WITH" | "EXACT";

type StrExpression<T extends Nullable<string>> = CmpExpression<T> & {

    __type(): { 
        selectionLike: true;
        expression: T | undefined;
        cmpExpression: T | undefined;
        numExpression: T | undefined;
        strExpresion: T | undefined;
    }

    like(
        value: string | StrExpression<string>, 
        mode?: LikeMode
    ): AnyExpression<boolean> | undefined;

    ilike(
        value: string | StrExpression<string>, 
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

    concat<X extends Nullable<string>>(
        ...values: ReadonlyArray<string | StrExpression<X>>
    ): StrExpression<T | X>;
}

export type MakeType<T, TNullity extends NullityType> =
    TNullity extends "NONNULL"
        ? T
        : T | null | undefined;

export function and(
    ...predicates: ReadonlyArray<Nullable<AnyExpression<boolean>>>
): AnyExpression<boolean> | undefined {
    supressUnused(predicates);
    throw new Error();
}

export function or(
    ...predicates: ReadonlyArray<Nullable<AnyExpression<boolean>>>
): AnyExpression<boolean> | undefined {
    supressUnused(predicates);
    throw new Error();
}

export function not(
    ...predicates: ReadonlyArray<Nullable<AnyExpression<boolean>>>
): AnyExpression<boolean> | undefined {
    supressUnused(predicates);
    throw new Error();
}

export type ExpressionLike = {
    __type(): {
        expressionLike: true;
    }
};

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

export function constant(
    value: number
): Expression<number> {
    supressUnused(value);
    throw new Error();
}
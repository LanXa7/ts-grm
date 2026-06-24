import { CombinedNullity } from "@/schema/prop";
import { CompilationError } from "@/utils"
import { ExpressionSubQuery } from "./sub_query";
import { AtLeastOne, ExpressionOrder, IsNull } from "./utils";
import { AbstractStrExpr, ConcatExpr } from "@/impl/ast/str_expr";
import { ArgumentError } from "@/error/common";
import { getInternalFactory } from "@/impl/ast/internal_factory";
import { OrderNullsType } from "@/schema/order";
import { CompoundPred } from "@/impl/ast/pred";
import { ConstantExpr } from "@/impl/ast/constant";
import { I64PropContract, NullityType, ScalarPropContract } from "@/schema/prop_contract";

export type Expression<
    T, 
    TAs extends AsBound<T> = ""
> = 
    NonNull<T> extends string
        ? TAs extends "AS_NUMBER"
            ? NumExpression<T & Nullable<string>>
        : TAs extends "AS_ENUM_SET"
            ? EnumSetExpression<T & Nullable<string>>
        : StrExpression<T & Nullable<string>>
    : NonNull<T> extends Date
        ? DateExpression<T & Nullable<Date>>
    : NonNull<T> extends number
        ? NumExpression<T & Nullable<number>>
    : AnyExpression<T>;

export type AnyExpression<T, TAs extends AsBound<T> = ""> = 
    AnyExpressionItf<T, TAs> & NullableMethods<T, TAs>;

export type CmpExpression<T, TAs extends AsBound<T> = ""> = 
    CmpExpressionItf<T, TAs> & NullableMethods<T, TAs>;

export type StrExpression<T extends Nullable<string>> = 
    StrExpressionItf<T> & NullableMethods<T, "">;

export type NumExpression<T extends Nullable<string | number>> = 
    NumExpressionItf<T> 
    & NullableMethods<T, NonNull<T> extends string ? "AS_NUMBER" : "">;

export type EnumSetExpression<T extends Nullable<string>> = 
    EnumSetExpressionItf<T> & NullableMethods<T, "">;

export type DateExpression<T extends Nullable<Date>> = 
    DateExpressionItf<T> & NullableMethods<T, "">;

export type AsBound<T> = T extends string ? "AS_NUMBER" | "AS_ENUM_SET" | "" : "";

export type Predicate = AnyExpression<boolean>;

export type NonNull<T> = Exclude<T, null | undefined>;

export type Nullable<T> = T | null | undefined;

export type RHSType<T, TAs extends AsBound<T>> =
    NonNull<T> | AnyExpression<NonNull<T>, TAs> | AnyExpression<Nullable<T>, TAs> 
        | (
            TAs extends "AS_NUMBER"
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

export type NonNullRHSType<T, TAs extends AsBound<T>> =
    NonNull<T> | AnyExpression<NonNull<T>, TAs> 
        | (
            TAs extends "AS_NUMBER"
                ? number | AnyExpression<NonNull<number>, any>
                : never
        )
        | (
            T extends number
                ? AnyExpression<NonNull<string>, "AS_NUMBER">
                : never
        );

export type CoalesceArgs<T> =
    [
        ...AnyExpression<Nullable<T>>[],
        ...([] | [NonNull<T>] | [AnyExpression<NonNull<T>>])
    ];

export type CoalesceDataType<T, TArgs extends any[]> =
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

export type MergeNullableType<
    T1 extends Nullable<string | number>, 
    T2 extends Nullable<string | number>
> =
    string extends T1 | T2
        ? Exclude<T1 | T2, number> 
        : T1 | T2;

export type LikeMode = "CONTAINS" | "STARTS_WITH" | "ENDS_WITH" | "EXACT";

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
        : T | null;

export type MakeExpression<TProp, TNullity extends NullityType> =
    TProp extends I64PropContract<infer R, infer Nullity>
        ? Expression<
            MakeType<R, CombinedNullity<Nullity, TNullity>>, 
            R extends string ? "AS_NUMBER" : ""
        >
    : TProp extends ScalarPropContract<infer R, infer Nullity>
        ? Expression<
            MakeType<R, CombinedNullity<Nullity, TNullity>>
        >
    : never;

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
        readonly expressionLike: true;
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

export type SubqueryError = 
    CompilationError<`Cannot directly use subqueries in 'IN' expressions.
Either use the 'inSubQuery()' function for collection operations;
or use 'asValue()' to convert the subquery into a single value before using it.`>;

export type HasSubqueryInArray<Arr extends any[]> = 
    Arr extends [infer First, ...infer Rest]
        ? First extends { __type(): { expressionSubQuery: any }; }
            ? true 
            : HasSubqueryInArray<Rest>
        : false;

export interface AnyExpressionItf<T, TAs extends AsBound<T>> {
    
    __type(): {
        readonly selectionLike: true;
        readonly expressionLike: true;
        readonly expression: true;
        readonly __t?: T;
        readonly __as?: TAs;
    };

    asc(nulls?: OrderNullsType): ExpressionOrder;

    desc(nulls?: OrderNullsType): ExpressionOrder;

    eq(
        value: RHSType<T, TAs>
    ): AnyExpression<boolean>;
    
    ne(
        value: RHSType<T, TAs>
    ): AnyExpression<boolean>;

    in<Values extends NonNullRHSType<T, TAs>[]>(
        ...values: HasSubqueryInArray<Values> extends true 
            ? [SubqueryError]
            : Values
    ): AnyExpression<boolean>;

    inSubQuery(
        subQuery: ExpressionSubQuery<Expression<NonNull<T>, TAs>>
    ): AnyExpression<boolean>;

    notIn<Values extends NonNullRHSType<T, TAs>[]>(
        ...values: HasSubqueryInArray<Values> extends true 
            ? [SubqueryError]
            : Values
    ): AnyExpression<boolean>;

    notInSubQuery(
        subQuery: ExpressionSubQuery<Expression<NonNull<T>, TAs>>
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
}

export interface CmpExpressionItf<T, TAs extends AsBound<T>> extends AnyExpressionItf<T, TAs> {
    
    __type(): {
        readonly selectionLike: true;
        readonly expressionLike: true;
        readonly expression: true;
        readonly cmpExpression: true;
        readonly __t?: T;
        readonly __as?: TAs;
    };
    
    lt(
        value: RHSType<T, TAs>
    ): AnyExpression<boolean>;
    
    lte(
        value: RHSType<T, TAs>
    ): AnyExpression<boolean>;
    
    gt(
        value: RHSType<T, TAs>
    ): AnyExpression<boolean>;
    
    gte(
        value: RHSType<T, TAs>
    ): AnyExpression<boolean>;

    between(
        min: RHSType<T, TAs>,
        max: RHSType<T, TAs>
    ): AnyExpression<boolean>;
    
    ltIf(
        value: Nullable<T>
    ): AnyExpression<boolean> | undefined;
    
    lteIf(
        value: Nullable<T>
    ): AnyExpression<boolean> | undefined;
    
    gtIf(
        value: Nullable<T>
    ): AnyExpression<boolean> | undefined;
    
    gteIf(
        value: Nullable<T>
    ): AnyExpression<boolean> | undefined;

    betweenIf(
        min: Nullable<T>,
        max: Nullable<T>
    ): AnyExpression<boolean> | undefined;
}

export interface StrExpressionItf<T extends Nullable<string>> extends CmpExpressionItf<T, ""> {

    __type(): {
        readonly selectionLike: true;
        readonly expressionLike: true;
        readonly expression: true;
        readonly cmpExpression: true;
        readonly strExpression: true;
        readonly __t?: T;
        readonly __as?: "";
    };

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

export interface NumExpressionItf<T extends Nullable<string | number>> extends CmpExpressionItf<T, T extends string ? "AS_NUMBER" : ""> {

    __type(): {
        readonly selectionLike: true;
        readonly expressionLike: true;
        readonly expression: true;
        readonly cmpExpression: true;
        readonly numExpression: true;
        readonly __t?: T;
        readonly __as?: T extends string ? "AS_NUMBER" : "";
    };

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

export interface EnumSetExpressionItf<T extends Nullable<string>> extends AnyExpressionItf<T, ""> {

    __type(): {
        readonly selectionLike: true;
        readonly expressionLike: true;
        readonly expression: true;
        readonly cmpExpression: true;
        readonly enumSetExpression: true;
        readonly __t?: T;
        readonly __as?: "";
    };
    
    containsAny(...values: AtLeastOne<T>): Predicate;

    notContainsAny(...values: AtLeastOne<T>): Predicate;

    containsAll(...values: AtLeastOne<T>): Predicate;

    notContainsAll(...values: AtLeastOne<T>): Predicate;
}

export interface DateExpressionItf<T extends Nullable<Date>> extends CmpExpressionItf<T, ""> {

    __type(): {
        readonly selectionLike: true;
        readonly expressionLike: true;
        readonly expression: true;
        readonly cmpExpression: true;
        readonly dateExpression: true;
        readonly __t?: T;
        readonly __as?: "";
    };
    
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
}

export type NullableMethods<T, TAs extends AsBound<T>> =
    IsNull<T> extends true
        ? { 
            isNull(): AnyExpression<boolean>;

            isNotNull(): AnyExpression<boolean>;

            coalesce<TArgs extends CoalesceArgs<T>>(
                ...exprs: TArgs
            ): Expression<CoalesceDataType<T, TArgs>, TAs & AsBound<CoalesceDataType<T, TArgs>>>;

            asNonNull(): Expression<NonNull<T>, TAs>;
        }
        : object;

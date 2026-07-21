import { Expression, ExpressionLike } from "./expression";
import { AggregateExpr } from "@/impl/ast/aggregate_expr";
import { AbstractExpr } from "@/impl/ast";

export function count(
    expr?: ExpressionLike
): Expression<number, ""> {
    return new AggregateExpr(
        "COUNT", 
        expr as any as AbstractExpr<any> | undefined
    ) as any as Expression<number, "">;
}

export function sum(
    expr: Expression<number, "">
): Expression<number | null, "">;

export function sum(
    expr: Expression<string, "AS_NUMBER">
): Expression<string | null, "AS_NUMBER">;

export function sum(
    expr: Expression<number, ""> | Expression<string, "AS_NUMBER">
): any {
    return new AggregateExpr("SUM", expr as any as AbstractExpr<any>);
}

export function max(
    expr: Expression<number, "">
): Expression<number | null, "">;

export function max(
    expr: Expression<string, "AS_NUMBER">
): Expression<string | null, "AS_NUMBER">;

export function max(
    expr: Expression<number, ""> | Expression<string, "AS_NUMBER">
): any {
    return new AggregateExpr("MAX", expr as any as AbstractExpr<any>);
}

export function min(
    expr: Expression<number, "">
): Expression<number | null, "">;

export function min(
    expr: Expression<string, "AS_NUMBER">
): Expression<string | null, "AS_NUMBER">;

export function min(
    expr: Expression<number, ""> | Expression<string, "AS_NUMBER">
): any {
    return new AggregateExpr("MIN", expr as any as AbstractExpr<any>);
}

export function avg(
    expr: Expression<number, "">
): Expression<number | null, "">;

export function avg(
    expr: Expression<string, "AS_NUMBER">
): Expression<string | null, "AS_NUMBER">;

export function avg(
    expr: Expression<number, ""> | Expression<string, "AS_NUMBER">
): any {
    return new AggregateExpr("AVG", expr as any as AbstractExpr<any>);
}
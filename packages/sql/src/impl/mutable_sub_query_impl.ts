import { spi, ExpressionLike, MutableSubQuery, SubQueryProjection, SubQuerySelectArrArgs } from "@ts-grm/core";
import { AbstractMutableQuery } from "./abstract_mutable_query";
import { AbstractSubQueryProjection } from "./query_projection";

export class MutableSubQueryImpl 
extends AbstractMutableQuery
implements MutableSubQuery {

    __type(): { mutableSubQuery: true; } {
        return { mutableSubQuery: true };
    }

    constructor(
        tables: ReadonlyArray<spi.AbstractTable>
    ) {
        super(tables);
    }

    select<
            const TExpressions extends SubQuerySelectArrArgs,
    >(
        ...expressions: TExpressions
    ): SubQueryProjection<TExpressions, "TUPLE">;

    select<TExpression extends ExpressionLike>(
        expression: TExpression
    ): SubQueryProjection<TExpression, "EXPRESSION">;

    select(...args: any[]): SubQueryProjection<any, any> {
        return AbstractSubQueryProjection.of(args, false);
    }

    selectDistinct<
            const TExpressions extends SubQuerySelectArrArgs,
    >(
        ...expressions: TExpressions
    ): SubQueryProjection<TExpressions, "TUPLE">;

    selectDistinct<TExpression extends ExpressionLike>(
        expression: TExpression
    ): SubQueryProjection<TExpression, "EXPRESSION">;

    selectDistinct(...args: any[]): SubQueryProjection<any, any> {
        return AbstractSubQueryProjection.of(args, true);
    }
}
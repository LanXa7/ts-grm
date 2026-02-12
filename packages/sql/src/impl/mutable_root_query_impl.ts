import { dsl, err, ExpressionLike, ExpressionOrder, MutableRootQuery, Predicate, RootQueryProjection, RootQuerySelectArrArgs, RootQuerySelection, RootQuerySelectMapArgs, supressUnused } from "@ts-grm/core";
import { SqlClientImplementor } from "@/sql_client";
import { AbstractRootQueryProjection } from "./root_query_projection";

export class MutableRootQueryImpl implements MutableRootQuery {

    private _predicate: Predicate | undefined = undefined;

    private readonly _orders: Array<ExpressionOrder> = [];

    private _groupByExprs: ReadonlyArray<ExpressionLike> | undefined = undefined;

    private _havingPreidicate: Predicate | undefined = undefined;

    __type(): { mutableRootQuery: true; } {
        return { mutableRootQuery: true };
    }

    constructor(readonly sqlClient: SqlClientImplementor) {}
    
    where(
        ...predicates: ReadonlyArray<Predicate | null | undefined>
    ): this {
        this._predicate = dsl.and(this._predicate, ...predicates);
        return this;
    }

    orderBy(
        ...orders: ReadonlyArray<ExpressionLike | ExpressionOrder>
    ): this {
        for (const value of orders) {
            if (value != null) {
                if (value instanceof ExpressionOrder) {
                    this._orders.push(value);
                } else {
                    this._orders.push(
                        new ExpressionOrder(value, false, "UNSPECIFIED")
                    );
                }
            }
        }
        return this;
    }

    groupBy(
        ...expressions: ReadonlyArray<ExpressionLike>
    ): this {
        if (this._groupByExprs != null) {
            throw new err.StateError(`"groupBy" can nonly be invoked once`);   
        }
        if (expressions.length === 0) {
            throw new err.ArgumentError("The argument cannot be empty");
        }
        this._groupByExprs = [...expressions];
        return this;
    }

    having(
        ...predicates: ReadonlyArray<Predicate | null | undefined>
    ): this {
        if (this._groupByExprs == null) {
            throw new err.StateError(`"having" cannot be invoked before "groupBy"`);
        }
        this._havingPreidicate = dsl.and(this._havingPreidicate, ...predicates);
        return this;
    }

    select<
        const TSelections extends RootQuerySelectArrArgs
    >(
        ...selections: TSelections
    ): RootQueryProjection<{
        [K in keyof TSelections]: 
            TSelections[K] extends RootQuerySelection<infer U> ? RootQuerySelection<U> : never
    }, "ARRAY">;

    select<
        const TSelections extends RootQuerySelectMapArgs
    >(
        selections: TSelections
    ): RootQueryProjection<{
        [K in keyof TSelections]: 
            TSelections[K] extends RootQuerySelection<infer U> ? RootQuerySelection<U> : never
    }, "MAP">;

    select<TSelection extends RootQuerySelection<any>>(
        selection: TSelection
    ) : RootQueryProjection<TSelection, "ONE">;

    select(...arr: any[]): any {
        return AbstractRootQueryProjection.of(arr);
    }
}
import { err, ExpressionLike, ExpressionOrder, MutableRootQuery, Predicate, RootQueryProjection, RootQuerySelectArrArgs, RootQuerySelection, RootQuerySelectMapArgs, supressUnused } from "@ts-grm/core";

export class MutableRootQueryImpl implements MutableRootQuery {

    private readonly _predicates: Array<Predicate> = [];

    private readonly _orders: Array<ExpressionOrder> = [];

    private _groupByExprs: ReadonlyArray<ExpressionLike> | undefined = undefined;

    private readonly _havingPreidicates: Array<Predicate> = [];

    __type(): { mutableRootQuery: true; } {
        return { mutableRootQuery: true };
    }
    
    where(
        ...predicates: ReadonlyArray<Predicate | null | undefined>
    ): this {
        for (const predicate of predicates) {
            if (predicate != null) {
                this._predicates.push(predicate);
            }
        }
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
        for (const predicate of predicates) {
            if (predicate != null) {
                this._havingPreidicates.push(predicate);
            }
        }
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

    select(selections: any): any {
        supressUnused(selections);
        throw new Error();
    }
}
import { dsl, err, spi, ExpressionLike, ExpressionOrder, Predicate } from "@ts-grm/core";

export class AbstractMutableQuery {

    private _predicate: Predicate | undefined = undefined;

    private readonly _orders: Array<ExpressionOrder> = [];

    private _groupByExprs: ReadonlyArray<ExpressionLike> | undefined = undefined;

    private _havingPredicate: Predicate | undefined = undefined;

    constructor(
        readonly tables: ReadonlyArray<spi.AbstractTable>
    ) {}

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
        this._havingPredicate = dsl.and(this._havingPredicate, ...predicates);
        return this;
    }

    get wherePred(): spi.AbstractPred | undefined {
        return this._predicate as spi.AbstractPred | undefined;
    }
    
    get orders(): ReadonlyArray<ExpressionOrder> {
        return this._orders;
    }
    
    get groupByExprs(): ReadonlyArray<spi.AbstractExpr<any>> | undefined {
        return this._groupByExprs as ReadonlyArray<spi.AbstractExpr<any>> | undefined;
    }
    
    get havingPred(): spi.AbstractPred | undefined {
        return this._havingPredicate as spi.AbstractPred | undefined;
    }
}
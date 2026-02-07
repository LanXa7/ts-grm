import { AbstractCmpExpr } from "./expr";
import { literal } from "./literal";

export class AbstractNumExpr<T extends string | number> extends AbstractCmpExpr<T> {

    __type(): { 
        selectionLike: true;
        expressionLike: true;
        expression: T | undefined;
        cmpExpression: T | undefined;
        numExpression: T | undefined;
    } {
        return {
            selectionLike: true,
            expressionLike: true,
            expression: undefined,
            cmpExpression: undefined,
            numExpression: undefined
        };
    }

    unaryMinus(): AbstractNumExpr<T> {
        return new UnaryMinusExpr(this);
    }

    plus<X extends string | number>(
        value: X | AbstractNumExpr<T>
    ): AbstractNumExpr<MergeNumType<T, X>> {
        return new BinaryNumExpr(
            "+", 
            this, 
            value instanceof AbstractNumExpr ? value : 
                typeof value === "string"
                    ? literal(value, true)
                    : literal(value)
        );
    }

    minus<X extends string | number>(
        value: X | AbstractNumExpr<T>
    ): AbstractNumExpr<MergeNumType<T, X>> {
        return new BinaryNumExpr(
            "-", 
            this, 
            value instanceof AbstractNumExpr ? value : 
                typeof value === "string"
                    ? literal(value, true)
                    : literal(value)
        );
    }

    times<X extends string | number>(
        value: X | AbstractNumExpr<T>
    ): AbstractNumExpr<MergeNumType<T, X>> {
        return new BinaryNumExpr(
            "*", 
            this, 
            value instanceof AbstractNumExpr ? value : 
                typeof value === "string"
                    ? literal(value, true)
                    : literal(value)
        );
    }

    div<X extends string | number>(
        value: X | AbstractNumExpr<T>
    ): AbstractNumExpr<MergeNumType<T, X>> {
        return new BinaryNumExpr(
            "/", 
            this, 
            value instanceof AbstractNumExpr ? value : 
                typeof value === "string"
                    ? literal(value, true)
                    : literal(value)
        );
    }

    rem<X extends string | number>(
        value: X | AbstractNumExpr<T>
    ): AbstractNumExpr<MergeNumType<T, X>> {
        return new BinaryNumExpr(
            "%", 
            this, 
            value instanceof AbstractNumExpr ? value : 
                typeof value === "string"
                    ? literal(value, true)
                    : literal(value)
        );
    }
}

class UnaryMinusExpr<T extends number | string> extends AbstractNumExpr<T> {

    constructor(
        readonly expr: AbstractNumExpr<T>
    ) {
        super();
    }

    override unaryMinus(): AbstractNumExpr<T> {
        return this.expr;
    }
}

class BinaryNumExpr<T extends number | string> extends AbstractNumExpr<T> {

    constructor(
        readonly op: BinaryNumOp,
        readonly left: AbstractNumExpr<any>,
        readonly right: AbstractNumExpr<any>
    ) {
        super();
    }
}

type BinaryNumOp = "+" | "-" | "*" | "/" | "%";

type MergeNumType<
    T1 extends string | number | null | undefined, 
    T2 extends string | number | null | undefined
> =
    string extends T1 | T2
        ? Exclude<T1 | T2, number> 
        : T1 | T2;

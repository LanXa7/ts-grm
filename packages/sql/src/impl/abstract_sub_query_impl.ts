import { spi } from "@ts-grm/core";

export abstract class AbstractTupleSubQueryImpl {

    __type(): {
        selectionLike: true;
        expressionLike: true;
        expression: [any, any] | true;
        subQueryLike: true;
        tupleSubQuery: true;
    } {
        return {
            selectionLike: true,
            expressionLike: true,
            expression: true,
            subQueryLike: true,
            tupleSubQuery: true
        };
    }

    get level(): "SUB" {
        return "SUB";
    }

    asValue(): this {
        return this;
    }

    get isRecursive(): boolean {
        return false;
    }

    get recursivePred(): spi.AbstractPred | undefined {
        return undefined;
    }
}

export abstract class AbstractExprSubQueryImpl extends spi.AbstractExpr<any> {

    __type(): {
        readonly selectionLike: true;
        readonly expressionLike: true;
        readonly expression: true;
        readonly anyExpression: true;
        readonly subQueryLike: true;
        readonly expressionSubQuery: true;
    } {
        return {
            selectionLike: true,
            expressionLike: true,
            expression: true,
            anyExpression: true,
            subQueryLike: true,
            expressionSubQuery: true
        };
    }

    get level(): "SUB" {
        return "SUB";
    }

    asValue(): this {
        return this;
    }

    get isRecursive(): boolean {
        return false;
    }

    get recursivePred(): spi.AbstractPred | undefined {
        return undefined;
    }
}

export abstract class AbstractNumSubQueryImpl extends spi.AbstractNumExpr<any> {

    __type(): {
        readonly selectionLike: true;
        readonly expressionLike: true;
        readonly expression: true;
        readonly anyExpression: true;
        readonly cmpExpression: true;
        readonly numExpression: true;
        readonly subQueryLike: true;
        readonly expressionSubQuery: true;
    } {
        return {
            selectionLike: true,
            expressionLike: true,
            expression: true,
            anyExpression: true,
            cmpExpression: true,
            numExpression: true,
            subQueryLike: true,
            expressionSubQuery: true
        };
    }

    get level(): "SUB" {
        return "SUB";
    }

    asValue(): this {
        return this;
    }

    get isRecursive(): boolean {
        return false;
    }

    get recursivePred(): spi.AbstractPred | undefined {
        return undefined;
    }
}

export abstract class AbstractStrSubQueryImpl extends spi.AbstractStrExpr {

    __type(): {
        readonly selectionLike: true;
        readonly expressionLike: true;
        readonly expression: true;
        readonly anyExpression: true;
        readonly cmpExpression: true;
        readonly strExpression: true;
        readonly subQueryLike: true;
        readonly expressionSubQuery: true;
    } {
        return {
            selectionLike: true,
            expressionLike: true,
            expression: true,
            anyExpression: true,
            cmpExpression: true,
            strExpression: true,
            subQueryLike: true,
            expressionSubQuery: true
        };
    }

    get level(): "SUB" {
        return "SUB";
    }

    asValue(): this {
        return this;
    }

    get isRecursive(): boolean {
        return false;
    }

    get recursivePred(): spi.AbstractPred | undefined {
        return undefined;
    }
}

export abstract class AbstractDtSubQueryImpl extends spi.AbstractDtExpr {

    __type(): {
        readonly selectionLike: true;
        readonly expressionLike: true;
        readonly expression: true;
        readonly anyExpression: true;
        readonly cmpExpression: true;
        readonly dtExpression: true;
        readonly subQueryLike: true;
        readonly expressionSubQuery: true;
    } {
        return {
            selectionLike: true,
            expressionLike: true,
            expression: true,
            anyExpression: true,
            cmpExpression: true,
            dtExpression: true,
            subQueryLike: true,
            expressionSubQuery: true
        };
    }

    asValue(): this {
        return this;
    }

    get isRecursive(): boolean {
        return false;
    }

    get recursivePred(): spi.AbstractPred | undefined {
        return undefined;
    }
}

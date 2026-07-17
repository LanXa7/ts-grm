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
        selectionLike: true;
        expressionLike: true;
        expression: [any, any] | true;
        subQueryLike: true;
        expressionSubQuery: true;
    } {
        return {
            selectionLike: true,
            expressionLike: true,
            expression: true,
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
        selectionLike: true;
        expressionLike: true;
        expression: [any, any] | true;
        cmpExpression: true;
        numExpression: true;
        subQueryLike: true;
        expressionSubQuery: true;
    } {
        return {
            selectionLike: true,
            expressionLike: true,
            expression: true,
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
        selectionLike: true;
        expressionLike: true;
        expression: [any, any] | true;
        cmpExpression: true;
        strExpression: true;
        subQueryLike: true;
        expressionSubQuery: true;
    } {
        return {
            selectionLike: true,
            expressionLike: true,
            expression: true,
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
        selectionLike: true;
        expressionLike: true;
        expression: [any, any] | true;
        cmpExpression: true;
        dtExpression: true;
        subQueryLike: true;
        expressionSubQuery: true;
    } {
        return {
            selectionLike: true,
            expressionLike: true,
            expression: true,
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

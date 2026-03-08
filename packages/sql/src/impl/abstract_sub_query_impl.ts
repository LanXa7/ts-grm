import { ast } from "@ts-grm/core";

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

    asValue(): this {
        return this;
    }

    get isRecursive(): boolean {
        return false;
    }

    get recursivePred(): ast.AbstractPred | undefined {
        return undefined;
    }
}

export abstract class AbstractExprSubQueryImpl extends ast.AbstractExpr<any> {

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

    asValue(): this {
        return this;
    }

    get isRecursive(): boolean {
        return false;
    }

    get recursivePred(): ast.AbstractPred | undefined {
        return undefined;
    }
}

export abstract class AbstractNumSubQueryImpl extends ast.AbstractNumExpr<any> {

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

    asValue(): this {
        return this;
    }

    get isRecursive(): boolean {
        return false;
    }

    get recursivePred(): ast.AbstractPred | undefined {
        return undefined;
    }
}

export abstract class AbstractStrSubQueryImpl extends ast.AbstractStrExpr {

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

    asValue(): this {
        return this;
    }

    get isRecursive(): boolean {
        return false;
    }

    get recursivePred(): ast.AbstractPred | undefined {
        return undefined;
    }
}

export abstract class AbstractDtSubQueryImpl extends ast.AbstractDtExpr {

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

    get recursivePred(): ast.AbstractPred | undefined {
        return undefined;
    }
}

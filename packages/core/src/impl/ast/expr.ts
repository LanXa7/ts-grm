import { ExpressionOrder, ExpressionSubQuery } from "@/dsl";
import { AbstractPred, CmpPred, InCollectionPred, NullityPred } from "./pred";
import { supressUnused } from "@/utils";

export class AbstractExpr<T> {

    __type(): {
        selectionLike: true;
        expressionLike: true;
        expression: T | undefined;
    } {
        return {
            selectionLike: true,
            expressionLike: true,
            expression: undefined
        };
    }

    asc(): ExpressionOrder {
        throw new Error();
    }
    
    desc(): ExpressionOrder {
        throw new Error();
    }

    eq(
        value: T | AbstractExpr<T>
    ): CmpPred {
        return new CmpPred(
            "=", 
            this, 
            value instanceof AbstractExpr ? value :  new LiteralExpr(value)
        );
    }
    
    ne(
        value: T | AbstractExpr<T>
    ): CmpPred {
        return new CmpPred(
            "<>", 
            this, 
            value instanceof AbstractExpr ? value :  new LiteralExpr(value)
        );
    }

    in(
        values: ReadonlyArray<T | AbstractExpr<T>>
    ): AbstractPred {
        InCollectionPred.validateValues(values);
        if (values.length === 1) {
            return new CmpPred(
                "=", 
                this, 
                values[0] instanceof AbstractExpr ? values[0] : new LiteralExpr(values[0])
            );
        }
        return new InCollectionPred(this, values);
    }

    inSubQuery(
        subQuery: ExpressionSubQuery<AbstractExpr<T>>
    ): AbstractExpr<boolean> {
        supressUnused(subQuery);
        throw new Error();
    }

    notIn(
        values: ReadonlyArray<T | AbstractExpr<T>>
    ): AbstractPred {
        InCollectionPred.validateValues(values);
        if (values.length === 1) {
            return new CmpPred(
                "<>", 
                this, 
                values[0] instanceof AbstractExpr ? values[0] : new LiteralExpr(values[0])
            );
        }
        return new InCollectionPred(this, values, true);
    }

    notInSubQuery(
        subQuery: ExpressionSubQuery<AbstractExpr<T>>
    ): AbstractExpr<boolean> {
        supressUnused(subQuery);
        throw new Error();
    }

    eqIf(
        value: T | null | undefined
    ): CmpPred | undefined {
        if (value == null) {
            return undefined;
        }
        return new CmpPred(
            "=", 
            this, 
            new LiteralExpr(value)
        );
    }
    
    neIf(
        value: T | null | undefined
    ): CmpPred | undefined {
        if (value == null) {
            return undefined;
        }
        return new CmpPred(
            "<>", 
            this, 
            new LiteralExpr(value)
        );
    }

    inIf(
        values: T[] | null | undefined
    ): AbstractPred | undefined {
        if (values == null) {
            return undefined;
        }
        InCollectionPred.validateValues(values);
        if (values.length === 1) {
            return new CmpPred(
                "=", 
                this, 
                new LiteralExpr(values[0])
            );
        }
        return new InCollectionPred(this, values);
    }

    notInIf(
        values: T[] | null | never
    ): AbstractExpr<boolean> | undefined {
        if (values == null) {
            return undefined;
        }
        InCollectionPred.validateValues(values);
        if (values.length === 1) {
            return new CmpPred(
                "<>", 
                this, 
                new LiteralExpr(values[0])
            );
        }
        return new InCollectionPred(this, values, true);
    }

    isNull(): AbstractExpr<boolean> {
        return new NullityPred(this);
    }

    isNotNull(): AbstractExpr<boolean> {
        return new NullityPred(this, true);
    }
    
    coalesce(
        values: T | AbstractExpr<T>
    ): AbstractExpr<T> {
        supressUnused(values);
        throw new Error();
    }
}

export class AbstractCmpExpr<T> extends AbstractExpr<T> {

    __type(): { 
        selectionLike: true;
        expressionLike: true;
        expression: T | undefined;
        cmpExpression: T | undefined;
    } {
        return {
            selectionLike: true,
            expressionLike: true,
            expression: undefined,
            cmpExpression: undefined
        };
    }

    lt(
        value: T | AbstractCmpExpr<T>
    ): CmpPred {
        return new CmpPred(
            "<", 
            this, 
            value instanceof AbstractExpr ? value :  new LiteralExpr(value)
        );
    }
    
    le(
        value: T | AbstractCmpExpr<T>
    ): CmpPred {
        return new CmpPred(
            "<=", 
            this, 
            value instanceof AbstractExpr ? value :  new LiteralExpr(value)
        );
    }
    
    gt(
        value: T | AbstractCmpExpr<T>
    ): CmpPred {
        return new CmpPred(
            ">", 
            this, 
            value instanceof AbstractExpr ? value :  new LiteralExpr(value)
        );
    }
    
    ge(
        value: T | AbstractCmpExpr<T>
    ): CmpPred {
        return new CmpPred(
            ">=", 
            this, 
            value instanceof AbstractExpr ? value :  new LiteralExpr(value)
        );
    }
    
    ltIf(
        value: T | null | undefined
    ): CmpPred | undefined {
        if (value == null) {
            return undefined;
        }
        return new CmpPred(
            "<", 
            this, 
            new LiteralExpr(value)
        );
    }
    
    leIf(
        value: T | null | undefined
    ): CmpPred | undefined {
        if (value == null) {
            return undefined;
        }
        return new CmpPred(
            "<=", 
            this, 
            new LiteralExpr(value)
        );
    }
    
    gtIf(
        value: T | null | undefined
    ): CmpPred | undefined {
        if (value == null) {
            return undefined;
        }
        return new CmpPred(
            ">", 
            this, 
            new LiteralExpr(value)
        );
    }
    
    geIf(
        value: T | null | undefined
    ): CmpPred | undefined {
        if (value == null) {
            return undefined;
        }
        return new CmpPred(
            ">=", 
            this, 
            new LiteralExpr(value)
        );
    }
}

export class LiteralExpr<T> extends AbstractExpr<T> {

    constructor(readonly value: T) {
        super();
    }
}
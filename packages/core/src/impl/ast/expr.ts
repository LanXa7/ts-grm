import { ExpressionOrder, ExpressionSubQuery } from "@/dsl";
import { supressUnused } from "@/utils";
import { ArgumentError } from "@/error/common";
import type { AbstractPred, CmpPred, NullityPred } from "./pred";
import type { CoalesceCmpExpr, CoalesceExpr } from "./coalesce_expr";
import { getInternalFactory, validateInValues } from "./internal_factory";
import { AbstractSelection } from "./selection";

export abstract class AbstractExpr<T> extends AbstractSelection {

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
        return getInternalFactory().createExprOrder(this, false);
    }
    
    desc(): ExpressionOrder {
        return getInternalFactory().createExprOrder(this, true);
    }

    eq(
        value: T | AbstractExpr<T>
    ): CmpPred {
        const factory = getInternalFactory();
        return factory.createCmpPred(
            "=", 
            this, 
            value instanceof AbstractExpr ? value :  factory.createLiteral(value)
        );
    }
    
    ne(
        value: T | AbstractExpr<T>
    ): CmpPred {
        const factory = getInternalFactory();
        return factory.createCmpPred(
            "<>", 
            this, 
            value instanceof AbstractExpr ? value :  factory.createLiteral(value)
        );
    }

    in(
        values: ReadonlyArray<T | AbstractExpr<T>>
    ): AbstractPred {
        validateInValues(values);
        const factory = getInternalFactory();
        if (values.length === 1) {
            return factory.createCmpPred(
                "=", 
                this, 
                values[0] instanceof AbstractExpr ? values[0] : factory.createLiteral(values[0])
            );
        }
        return factory.createInValuesPred(this, values, false);
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
        validateInValues(values);
        const factory = getInternalFactory();
        if (values.length === 1) {
            return factory.createCmpPred(
                "<>", 
                this, 
                values[0] instanceof AbstractExpr ? values[0] : factory.createLiteral(values[0])
            );
        }
        return factory.createInValuesPred(this, values, true);
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
        const factory = getInternalFactory();
        return factory.createCmpPred(
            "=", 
            this, 
            factory.createLiteral(value)
        );
    }
    
    neIf(
        value: T | null | undefined
    ): CmpPred | undefined {
        if (value == null) {
            return undefined;
        }
        const factory = getInternalFactory();
        return factory.createCmpPred(
            "<>", 
            this, 
            factory.createLiteral(value)
        );
    }

    inIf(
        values: T[] | null | undefined
    ): AbstractPred | undefined {
        if (values == null) {
            return undefined;
        }
        validateInValues(values);
        const factory = getInternalFactory();
        if (values.length === 1) {
            return factory.createCmpPred(
                "=", 
                this, 
                factory.createLiteral(values[0])
            );
        }
        return factory.createInValuesPred(this, values, false);
    }

    notInIf(
        values: T[] | null | never
    ): AbstractExpr<boolean> | undefined {
        if (values == null) {
            return undefined;
        }
        validateInValues(values);
        const factory = getInternalFactory();
        if (values.length === 1) {
            return factory.createCmpPred(
                "<>", 
                this, 
                factory.createLiteral(values[0])
            );
        }
        return factory.createInValuesPred(this, values, true);
    }

    isNull(): NullityPred {
        return getInternalFactory().createNullityPred(this, false);
    }

    isNotNull(): NullityPred {
        return getInternalFactory().createNullityPred(this, true);
    }
    
    coalesce(
        values: ReadonlyArray<T | AbstractExpr<T>>
    ): CoalesceExpr<T> {
        const factory = getInternalFactory();
        const arr = values.map(value => {
            if (value == null) {
                throw new ArgumentError("coalesce does not accept null/undefined value");
            }
            if (value instanceof AbstractExpr) {
                return value;
            }
            return factory.createLiteral(value);
        });
        return factory.createCoalesceExpr(this, arr);
    }
}

export abstract class AbstractCmpExpr<T> extends AbstractExpr<T> {

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
        const factory = getInternalFactory();
        return factory.createCmpPred(
            "<", 
            this, 
            value instanceof AbstractExpr ? value :  factory.createLiteral(value)
        );
    }
    
    le(
        value: T | AbstractCmpExpr<T>
    ): CmpPred {
        const factory = getInternalFactory();
        return factory.createCmpPred(
            "<=", 
            this, 
            value instanceof AbstractExpr ? value :  factory.createLiteral(value)
        );
    }
    
    gt(
        value: T | AbstractCmpExpr<T>
    ): CmpPred {
        const factory = getInternalFactory();
        return factory.createCmpPred(
            ">", 
            this, 
            value instanceof AbstractExpr ? value :  factory.createLiteral(value)
        );
    }
    
    ge(
        value: T | AbstractCmpExpr<T>
    ): CmpPred {
        const factory = getInternalFactory();
        return factory.createCmpPred(
            ">=", 
            this, 
            value instanceof AbstractExpr ? value : factory.createLiteral(value)
        );
    }
    
    ltIf(
        value: T | null | undefined
    ): CmpPred | undefined {
        if (value == null) {
            return undefined;
        }
        const factory = getInternalFactory();
        return factory.createCmpPred(
            "<", 
            this, 
            factory.createLiteral(value)
        );
    }
    
    leIf(
        value: T | null | undefined
    ): CmpPred | undefined {
        if (value == null) {
            return undefined;
        }
        const factory = getInternalFactory();
        return factory.createCmpPred(
            "<=", 
            this, 
            factory.createLiteral(value)
        );
    }
    
    gtIf(
        value: T | null | undefined
    ): CmpPred | undefined {
        if (value == null) {
            return undefined;
        }
        const factory = getInternalFactory();
        return factory.createCmpPred(
            ">", 
            this, 
            factory.createLiteral(value)
        );
    }
    
    geIf(
        value: T | null | undefined
    ): CmpPred | undefined {
        if (value == null) {
            return undefined;
        }
        const factory = getInternalFactory();
        return factory.createCmpPred(
            ">=", 
            this, 
            factory.createLiteral(value)
        );
    }

    override coalesce(
        values: ReadonlyArray<T | AbstractCmpExpr<T>>
    ): CoalesceCmpExpr<T> {
        const factory = getInternalFactory();
        const arr = values.map(value => {
            if (value == null) {
                throw new ArgumentError("coalesce does not accept null/undefined value");
            }
            if (value instanceof AbstractCmpExpr) {
                return value;
            }
            return factory.createLiteral(value) as AbstractCmpExpr<T>;
        });
        return factory.createCoalesceCmpExpr(this, arr);
    }
}

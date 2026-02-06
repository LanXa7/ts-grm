import { ExpressionSubQuery } from "@/dsl";
import { ExpressionOrder } from "@/dsl/utils";
import { supressUnused } from "@/utils";

export class Expr<T> {

    asc(): ExpressionOrder {
        throw new Error();
    }
    
    desc(): ExpressionOrder {
        throw new Error();
    }

    eq(
        value: T | Expr<T>
    ): Expr<boolean> {
        supressUnused(value);
        throw new Error();
    }
    
    ne(
        value: T | Expr<T>
    ): Expr<boolean> {
        supressUnused(value);
        throw new Error();
    }

    in(
        values: ReadonlyArray<T | Expr<T>>
    ): Expr<boolean> {
        supressUnused(values);
        throw new Error();
    }

    inSubQuery(
        subQuery: ExpressionSubQuery<Expr<T>>
    ): Expr<boolean> {
        supressUnused(subQuery);
        throw new Error();
    }

    notIn(
        values: ReadonlyArray<T | Expr<T>>
    ): Expr<boolean> {
        supressUnused(values);
        throw new Error();
    }

    notInSubQuery(
        subQuery: ExpressionSubQuery<Expr<T>>
    ): Expr<boolean> {
        supressUnused(subQuery);
        throw new Error();
    }

    eqIf(
        value: T | undefined
    ): Expr<boolean> | undefined {
        supressUnused(value);
        throw new Error();
    }
    
    neIf(
        value: T | undefined
    ): Expr<boolean> | undefined {
        supressUnused(value);
        throw new Error();
    }

    inIf(
        values: T[] | null | undefined
    ): Expr<boolean> | undefined {
        supressUnused(values);
        throw new Error();
    }

    notInIf(
        values: T[] | null | never
    ): Expr<boolean> | undefined {
        supressUnused(values);
        throw new Error();
    }

    isNull(): Expr<boolean> {
        throw new Error();
    }

    isNotNull(): Expr<boolean> {
        throw new Error();
    }
    
    coalesce(
        values: T | Expr<T>
    ): Expr<T> {
        supressUnused(values);
        throw new Error();
    }
}

export class CmpExpr<T> extends Expr<T> {

    lt(
        value: T | CmpExpr<T>
    ): Expr<boolean> {
        supressUnused(value);
        throw new Error();
    }
    
    le(
        value: T | CmpExpr<T>
    ): Expr<boolean> {
        supressUnused(value);
        throw new Error();
    }
    
    gt(
        value: T | CmpExpr<T>
    ): Expr<boolean> {
        supressUnused(value);
        throw new Error();
    }
    
    ge(
        value: T | CmpExpr<T>
    ): Expr<boolean> {
        supressUnused(value);
        throw new Error();
    }
    
    ltIf(
        value: T | null | undefined
    ): Expr<boolean> | undefined {
        supressUnused(value);
        throw new Error();
    }
    
    leIf(
        value: T | null | undefined
    ): Expr<boolean> | undefined {
        supressUnused(value);
        throw new Error();
    }
    
    gtIf(
        value: T | null | undefined
    ): Expr<boolean> | undefined {
        supressUnused(value);
        throw new Error();
    }
    
    geIf(
        value: T | null | undefined
    ): Expr<boolean> | undefined {
        supressUnused(value);
        throw new Error();
    }
}


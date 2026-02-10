export { AbstractSelection } from "./selection";
export { AbstractExpr } from "./expr";
export { AbstractPred } from "./pred";

import { InternalFactory, setInteralFactory } from "@/impl/ast/internal_factory";
import { CmpOp, CmpPred, InCollectionPred, NullityPred } from "@/impl/ast/pred";
import { AbstractExpr } from "@/impl/ast";
import { CoalesceCmpExpr, CoalesceDtExpr, CoalesceExpr, CoalesceNumExpr, CoalesceStrExpr } from "@/impl/ast/coalesce_expr";
import { AbstractCmpExpr } from "@/impl/ast/expr";
import { AbstractNumExpr } from "@/impl/ast/num_expr";
import { AbstractStrExpr } from "@/impl/ast/string_expr";
import { AbstractDtExpr } from "@/impl/ast/dt_expr";
import { createLiteral } from "@/impl/ast/literal";
import { ExpressionOrder } from "@/dsl";

class InternalFactoryImpl implements InternalFactory {

    createExprOrder(
        expr: AbstractExpr<any>, 
        desc: boolean
    ): ExpressionOrder {
        return new ExpressionOrder(expr, desc, "UNSPECIFIED");    
    }

    createCmpPred<T>(
        op: CmpOp,
        left: AbstractExpr<T>,
        right: AbstractExpr<T>
    ): CmpPred {
        return new CmpPred(op, left, right);
    }

    createInValuesPred<T>(
        expr: AbstractExpr<T>,
        values: ReadonlyArray<T | AbstractExpr<T>>,
        neg: boolean
    ): InCollectionPred<T> {
        return new InCollectionPred(expr, values, neg);
    }

    createNullityPred(
        expr: AbstractExpr<any>,
        neg: boolean
    ): NullityPred {
        return new NullityPred(expr, neg);
    }

    createCoalesceExpr<T>(
        expr: AbstractExpr<T>,
        defaultExprs: ReadonlyArray<AbstractExpr<T>>
    ): CoalesceExpr<T> {
        return new CoalesceExpr(expr, defaultExprs);
    }

    createCoalesceCmpExpr<T>(
        expr: AbstractCmpExpr<T>,
        defaultExprs: ReadonlyArray<AbstractCmpExpr<T>>
    ): CoalesceCmpExpr<T> {
        return new CoalesceCmpExpr(expr, defaultExprs);
    }

    createCoalesceNumExpr<T extends number | string>(
        expr: AbstractNumExpr<T>,
        defaultExprs: ReadonlyArray<AbstractNumExpr<T>>
    ): CoalesceNumExpr<T> {
        return new CoalesceNumExpr(expr, defaultExprs);
    }

    createCoalesceStrExpr(
        expr: AbstractStrExpr,
        defaultExprs: ReadonlyArray<AbstractStrExpr>
    ): CoalesceStrExpr {
        return new CoalesceStrExpr(expr, defaultExprs);
    }

    createCoalesceDtExpr(
        expr: AbstractDtExpr,
        defaultExprs: ReadonlyArray<AbstractDtExpr>
    ): CoalesceDtExpr {
        return new CoalesceDtExpr(expr, defaultExprs);
    }

    createLiteral(value: number): AbstractNumExpr<number>;

    createLiteral(value: string, asNumber: boolean): AbstractNumExpr<string>;

    createLiteral(value: string): AbstractStrExpr;

    createLiteral(value: Date): AbstractDtExpr;

    createLiteral<T>(value: T): AbstractExpr<T>;

    createLiteral(value: any, asNumber?: boolean | undefined): AbstractExpr<any> {
        return createLiteral(value, asNumber);
    }
}

setInteralFactory(new InternalFactoryImpl());
import { ArgumentError, StateError } from "@/error/common";
import type { AbstractCmpExpr, AbstractExpr } from "./expr";
import type { BetweenPred, CmpOp, CmpPred, InCollectionPred, InSubQueryPred, NullityPred } from "./pred";
import type { CoalesceCmpExpr, CoalesceDtExpr, CoalesceExpr, CoalesceNumExpr, CoalesceStrExpr } from "./coalesce_expr";
import type { AbstractNumExpr } from "./num_expr";
import type { AbstractStrExpr } from "./str_expr";
import type { AbstractDtExpr } from "./dt_expr";
import { ExpressionOrder } from "@/dsl";
import { ShadowAnchor } from "../shadow_anchor";
import { QueryContract } from "./query";

let _internalFactory: InternalFactory | undefined = undefined;

export function getInternalFactory(): InternalFactory {
    const factory = _internalFactory;
    if (factory == null) {
        throw new StateError("Internal factory is not set");
    }
    return factory;
}

export function setInternalFactory(factory: InternalFactory) {
    _internalFactory = factory;
}

export interface InternalFactory {

    createExprOrder(
        expr: AbstractExpr<any>, 
        desc: boolean
    ): ExpressionOrder;
    
    createCmpPred<T>(
        op: CmpOp,
        left: AbstractExpr<T>,
        right: AbstractExpr<T>
    ): CmpPred;

    createBetweenPred<T>(
        expr: AbstractCmpExpr<T>,
        min: AbstractExpr<T>,
        max: AbstractExpr<T>
    ): BetweenPred;

    createInCollectionPred<T>(
        expr: AbstractExpr<T>,
        values: ReadonlyArray<T | AbstractExpr<T>>,
        neg: boolean
    ): InCollectionPred<T>;

    createInSubQueryPred(
        expr: AbstractExpr<any>,
        subQuery: QueryContract,
        neg: boolean
    ): InSubQueryPred;

    createNullityPred(
        expr: AbstractExpr<any>,
        neg: boolean
    ): NullityPred;

    createCoalesceExpr<T>(
        expr: AbstractExpr<T>,
        defaultExprs: ReadonlyArray<AbstractExpr<T>>
    ): CoalesceExpr<T>;

    createCoalesceCmpExpr<T>(
        expr: AbstractCmpExpr<T>,
        defaultExprs: ReadonlyArray<AbstractCmpExpr<T>>
    ): CoalesceCmpExpr<T>;

    createCoalesceNumExpr<T extends number | string>(
        expr: AbstractNumExpr<T>,
        defaultExprs: ReadonlyArray<AbstractNumExpr<T>>
    ): CoalesceNumExpr<T>;

    createCoalesceStrExpr(
        expr: AbstractStrExpr,
        defaultExprs: ReadonlyArray<AbstractStrExpr>
    ): CoalesceStrExpr;

    createCoalesceDtExpr(
        expr: AbstractDtExpr,
        defaultExprs: ReadonlyArray<AbstractDtExpr>
    ): CoalesceDtExpr;

    createShadowExpr<T>(
        anchor: ShadowAnchor
    ): AbstractExpr<T>;

    createLiteral(value: number): AbstractNumExpr<number>;

    createLiteral(value: string, asNumber: boolean): AbstractNumExpr<string>;

    createLiteral(value: string): AbstractStrExpr;

    createLiteral(value: Date): AbstractDtExpr;

    createLiteral<T>(value: T): AbstractExpr<T>;
}

export function validateInValues(values: ReadonlyArray<any>) {
    for (const value of values) {
        const typeFn = value.__type;
        if (typeof typeFn === "function") {
            const type = typeFn();
            if (type != null && type.subQueryLike) {
                throw new ArgumentError(
                    `Cannot directly use subqueries in 'IN' expressions.
Either use the 'inSubQuery()' function for collection operations;
or use 'asValue()' to convert the subquery into a single value before using it.`
                );
            }
        }
    }
}

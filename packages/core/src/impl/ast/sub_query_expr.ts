import { ArgumentError } from "@/error/common";
import { AbstractDtExpr } from "./dt_expr";
import { Node } from "./node";
import { AbstractNumExpr } from "./num_expr";
import { QueryContract } from "./query";
import { AbstractStrExpr } from "./str_expr";
import { Visitor } from "./visitor";
import { AbstractPred } from "./pred";

export interface SubQueryExprContract extends Node {
    readonly op: SubQueryExprOp;
    readonly subQuery: QueryContract;
}

export type SubQueryExprOp = "ALL" | "ANY";

export function subQueryExpr(
    op: SubQueryExprOp,
    subQuery: QueryContract
): SubQueryExprContract {
    if (subQuery instanceof AbstractNumExpr) {
        return new NumSubQueryExpr(op, subQuery);
    }
    if (subQuery instanceof AbstractStrExpr) {
        return new StrSubQueryExpr(op, subQuery);
    }
    if (subQuery instanceof AbstractDtExpr) {
        return new DtSubQueryExpr(op, subQuery);
    }
    throw new ArgumentError("The arugment must subquery which returns number, string or Date");
}

class NumSubQueryExpr extends AbstractNumExpr<any> implements SubQueryExprContract {

    constructor(
        readonly op: SubQueryExprOp,
        readonly subQuery: QueryContract
    ) {
        super();
    }

    accept(visitor: Visitor): void {
        visitor.visitSubQueryExpr(this);
    }
}

class StrSubQueryExpr extends AbstractStrExpr implements SubQueryExprContract {

    constructor(
        readonly op: SubQueryExprOp,
        readonly subQuery: QueryContract
    ) {
        super();
    }

    accept(visitor: Visitor): void {
        visitor.visitSubQueryExpr(this);
    }
}

class DtSubQueryExpr extends AbstractDtExpr implements SubQueryExprContract {

    constructor(
        readonly op: SubQueryExprOp,
        readonly subQuery: QueryContract
    ) {
        super();
    }

    accept(visitor: Visitor): void {
        visitor.visitSubQueryExpr(this);
    }
}

export class ExistsPred extends AbstractPred {

    constructor(
        readonly subQuery: QueryContract,
        readonly neg: boolean
    ) {
        super();
    }

    negative(): AbstractPred {
        return new ExistsPred(
            this.subQuery,
            !this.neg
        );
    }

    accept(visitor: Visitor): void {
        visitor.visitExistsPred(this);
    }
}
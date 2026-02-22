import { ExpressionLike, ExpressionOrder, RootQuerySelection } from "@/dsl";
import { TableLike } from "@/dsl/table";
import { AbstractPred } from "./pred";
import { AbstractExpr } from "./expr";
import { AbstractTable } from "../abstrat_table";
import { MergedQueryKind } from "./query_factory";
import { Visitor } from "./visitor";

export type QueryContract = AtomQueryContract | MergedQueryContract;

export interface AtomQueryContract {

    readonly kind: "ATOM";

    readonly tables: ReadonlyArray<AbstractTable>;

    readonly wherePred: AbstractPred | undefined;

    readonly orders: ReadonlyArray<ExpressionOrder>;

    readonly groupByExprs: ReadonlyArray<AbstractExpr<any>> | undefined;

    readonly havingPred: AbstractPred | undefined;

    readonly options: AtomQueryOptions;

    readonly projection: ProjectionContract;

    accept(visitor: Visitor): void;
}

export interface MergedQueryContract {

    readonly kind: MergedQueryKind;

    readonly projection: ProjectionContract;

    readonly queries: ReadonlyArray<QueryContract>;

    accept(visitor: Visitor): void;
}

export type ProjectionContract = {
    readonly kind: "ROOT_SINGLE";
    readonly selection: RootQuerySelection<any>;
} | {
    readonly kind: "ROOT_ARRAY";
    readonly selections: ReadonlyArray<RootQuerySelection<any>>;
} | {
    readonly kind: "ROOT_MAP";
    readonly selections: { readonly [key: string]: RootQuerySelection<any> };
} | {
    kind: "SUB_SINGLE";
    readonly selection: ExpressionLike;
} | {
    kind: "SUB_ARRAY";
    readonly selections: ReadonlyArray<ExpressionLike>;
} | {
    kind: "BASE";
    selections: { readonly [key: string]: ExpressionLike | TableLike; }
};

export type AtomQueryOptions = {
    readonly distinct: boolean;
    readonly limit: number;
    readonly offset: number;
};

export const defaultAtomQueryOptions: AtomQueryOptions = {
    distinct: false,
    limit: -1,
    offset: 0
};
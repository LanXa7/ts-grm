import { ExpressionLike, ExpressionOrder, RootQuerySelection } from "@/dsl";
import { TableLike } from "@/dsl/table";
import { AbstractPred } from "./pred";
import { AbstractExpr } from "./expr";
import { AbstractTable } from "../abstract_table";
import { MergedQueryKind } from "./query_factory";
import { Node } from "./node";

export type QueryContract = AtomQueryContract | MergedQueryContract;

export interface AtomQueryContract extends Node {

    readonly kind: "ATOM";

    readonly tables: ReadonlyArray<AbstractTable>;

    readonly wherePred: AbstractPred | undefined;

    readonly orders: ReadonlyArray<ExpressionOrder>;

    readonly groupByExprs: ReadonlyArray<AbstractExpr<any>> | undefined;

    readonly havingPred: AbstractPred | undefined;

    readonly options: AtomQueryOptions;

    readonly projection: ProjectionContract;

    readonly isRecursive: boolean;

    readonly recursivePred: AbstractPred | undefined;
}

export interface MergedQueryContract extends Node {

    readonly kind: MergedQueryKind;

    readonly queries: ReadonlyArray<QueryContract>;

    readonly isRecursive: boolean;
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
    args: { readonly [key: string]: ExpressionLike | TableLike; }
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

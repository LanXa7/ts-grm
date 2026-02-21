import { ExpressionLike, ExpressionOrder, RootQuerySelection } from "@/dsl";
import { TableLike } from "@/dsl/table";
import { AbstractPred } from "./pred";
import { AbstractExpr } from "./expr";

export interface QueryContract {

    readonly wherePred: AbstractPred | undefined;

    readonly orders: ReadonlyArray<ExpressionOrder>;

    readonly groupByExprs: ReadonlyArray<AbstractExpr<any>> | undefined;

    readonly havingPred: AbstractPred | undefined;

    readonly limit: number | undefined;

    readonly offset: number | undefined;

    readonly distinct: boolean;

    readonly projection: ProjectionContract;
}

export type ProjectionContract = {
    kind: "ROOT_SINGLE";
    selection: RootQuerySelection<any>;
} | {
    kind: "ROOT_ARRAY";
    selections: ReadonlyArray<RootQuerySelection<any>>;
} | {
    kind: "ROOT_MAP";
    selections: { readonly [key: string]: RootQuerySelection<any> };
} | {
    kind: "SUB_SINGLE";
    selection: ExpressionLike;
} | {
    kind: "SUB_ARRAY";
    selections: ReadonlyArray<ExpressionLike>;
} | {
    kind: "BASE";
    selections: { readonly [key: string]: ExpressionLike | TableLike; }
};
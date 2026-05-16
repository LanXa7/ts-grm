import { AnyModel } from "@/schema/model";
import { Expression, ExpressionLike, Predicate } from "./expression";
import { ExpressionOrder } from "./utils";

export interface MutableRootQuery {

    __type(): { mutableRootQuery: true; };

    where(
        ...predicates: ReadonlyArray<Predicate | null | undefined>
    ): this;

    orderBy(
        ...orders: ReadonlyArray<ExpressionLike | ExpressionOrder>
    ): this;

    groupBy(
        ...expressions: ReadonlyArray<ExpressionLike>
    ): this;

    having(
        ...predicates: ReadonlyArray<Predicate | null | undefined>
    ): this;

    select<TSelection extends SelectionLike>(
        selection: TSelection
    ) : RootQueryProjection<TSelection, "ONE">;

    select<
        const TSelections extends RootQuerySelectArrArgs
    >(
        ...selections: TSelections
    ): RootQueryProjection<{
        [K in keyof TSelections]: 
            TSelections[K] extends RootQuerySelection<infer U> ? RootQuerySelection<U> : never
    }, "ARRAY">;

    select<
        const TSelections extends RootQuerySelectMapArgs
    >(
        selections: TSelections
    ): RootQueryProjection<{
        [K in keyof TSelections]: 
            TSelections[K] extends RootQuerySelection<infer U> ? RootQuerySelection<U> : never
    }, "MAP">;
}

export interface RootQuery<TProjection extends RootQueryProjection<any>> {

    __type(): { rootQuery: TProjection | true; };

    fetchList<
        TNullAsUndefined extends boolean = false
    >(
        options?: {
            readonly nullAsUndefined?: TNullAsUndefined 
        }
    ): Promise<Array<RowTypeOf<TProjection, TNullAsUndefined>>>;
}

export interface AtomRootQuery<TProjection extends RootQueryProjection<any>>
extends RootQuery<TProjection> {

    __type(): { 
        rootQuery: TProjection | true; 
        atomRootQuery: TProjection | true;
    };

    distinct(): AtomRootQuery<TProjection>;

    limit(limit: number): AtomRootQuery<TProjection>;

    offset(offset: number): AtomRootQuery<TProjection>;
}

export type RootQuerySelectArrArgs = [
    SelectionLike,
    SelectionLike,
    ...SelectionLike[]
];

export type RootQuerySelectMapArgs = Record<string, {
    __type(): { selectionLike: true };
}>;

export type RootQueryProjection<T, TKind = "ONE" | "ARRAY" | "MAP"> = {

    __type(): { selectedProjection: [T, TKind] | true };
};

export interface SelectionLike {

    __type(): {
        selectionLike: true;
    };
}

export interface FetchedView<TModel extends AnyModel, X> extends SelectionLike {

    __type(): {
        selectionLike: true;
        selectedView: [TModel, X] | true;
    };
};

export type RootQuerySelection<T> =
    Expression<T, any> |
    FetchedView<any, T>;

export type RowTypeOf<TPojection extends RootQueryProjection<any>, TNullAsUndefined extends boolean> =
    TPojection extends RootQueryProjection<infer TSelections, infer TKind>
        ? TKind extends "ONE"
            ? SelectedTypeOf<TSelections, TNullAsUndefined>
            : {
                [K in keyof TSelections]: SelectedTypeOf<TSelections[K], TNullAsUndefined>
            }
        : never;

type SelectedTypeOf<TSelection, TNullAsUndefined extends boolean> =
    TSelection extends FetchedView<any, infer R>
        ? NullAsUndefinedType<R, TNullAsUndefined>
    : TSelection extends Expression<infer R, any>
        ? NullAsUndefinedType<R, TNullAsUndefined>
    : never;

type NullAsUndefinedType<T, TNullAsUndefined> =
    TNullAsUndefined extends true
        ? null extends T
            ? NonNullable<T> | undefined
            : T
        : T;

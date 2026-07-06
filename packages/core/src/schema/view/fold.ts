import { ViewArgsImpl, ViewArgsKind, ViewTypeImpl } from ".";
import { ViewNullType } from "../dto";
import { AnyModel } from "../model";
import { RestrictKeys } from "./common";

export interface Fold<
    TModel extends AnyModel,
    TMembers,
    TKind extends ViewArgsKind,
    TArgs extends ViewArgsImpl<TModel, TMembers, TKind>
> {
    readonly [key: string]: FoldItemArgs<TModel, TMembers, TKind, TArgs>;
}

export interface FoldItemArgs<
    TModel extends AnyModel,
    TMembers,
    TKind extends ViewArgsKind,
    TArgs extends ViewArgsImpl<TModel, TMembers, TKind>
> {
    (ctx: FoldItemContext<TModel, TMembers, TKind>): TArgs;
}

interface FoldItemContext<
    TModel extends AnyModel,
    TMembers,
    TKind extends ViewArgsKind
> {

    <const TArgs extends ViewArgsImpl<TModel, TMembers, TKind>>(
        args: RestrictKeys<TArgs, keyof ViewArgsImpl<TModel, TMembers, TKind>>
    ): TArgs;
}

export type MakeFoldType<TViewArgs, TModel extends AnyModel, TMembers, TViewNullType extends ViewNullType> = 
    TViewArgs extends { $fold: infer Fold }
        ? MakeFoldItemType<
            Fold,
            TModel,
            TMembers,
            TViewNullType
        >
        : object;

type MakeFoldItemType<
    TFold, 
    TModel extends AnyModel, 
    TMembers, 
    TViewNullType extends ViewNullType
> = {
        [K in keyof TFold]: 
            TFold[K] extends FoldItemArgs<TModel, TMembers, infer _, infer TArgs>
                ? ViewTypeImpl<TModel, TArgs, TMembers, TViewNullType>
                : never
    };
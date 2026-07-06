import { ViewArgsImpl, ViewTypeImpl } from ".";
import { ViewNullType } from "../dto";
import { AnyModel } from "../model";

export type FoldArgs<
    TModel extends AnyModel,
    TMembers
> = {
    readonly [key: string]: ViewArgsImpl<TModel, TMembers, any>;
};

export type MakeFoldType<TViewArgs, TModel extends AnyModel, TMembers, TViewNullType extends ViewNullType> = 
    TViewArgs extends { $fold: infer FoldArgs }
        ? MakeFoldItemType<
            FoldArgs,
            TModel,
            TMembers,
            TViewNullType
        >
        : object;

type MakeFoldItemType<
    TFoldArgs, 
    TModel extends AnyModel, 
    TMembers, 
    TViewNullType extends ViewNullType
> = {
        [K in keyof TFoldArgs]: 
            ViewTypeImpl<TModel, TFoldArgs[K], TMembers, TViewNullType>
    };
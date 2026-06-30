import { ViewArgsImpl, ViewTypeImpl } from ".";
import { ViewNullType } from "../dto";
import { AnyModel } from "../model";

export type FoldArgs<
    TModel extends AnyModel,
    TMembers
> = {
    readonly [key: string]: ViewArgsImpl<TModel, TMembers>;
};

export type ApplyFold<T, TViewArgs, TModel extends AnyModel, TMembers, TViewNullType extends ViewNullType> = 
    TViewArgs extends { $fold: infer FoldArgs }
        ? MakeFoldType<
            T,
            FoldArgs,
            TModel,
            TMembers,
            TViewNullType
        >
        : T;

type MakeFoldType<
    T,
    TFoldArgs, 
    TModel extends AnyModel, 
    TMembers, 
    TViewNullType extends ViewNullType
> = 
    T & {
        [K in keyof TFoldArgs]: 
            ViewTypeImpl<TModel, TFoldArgs[K], TMembers, TViewNullType>
    };
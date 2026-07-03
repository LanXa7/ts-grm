import { ViewNullType } from "../dto";
import { AnyModel } from "../model";
import { ViewArgsImpl, ViewTypeImpl } from "../view";
import { With } from "./common";

export type EmbeddedPropArgs<TModel extends AnyModel, TMembers> =
    true 
    | With<TModel, TMembers, ViewArgsImpl<TModel, TMembers>>
    | EmbeddedPropArgsImpl<TModel, TMembers>;

interface EmbeddedPropArgsImpl<TModel extends AnyModel, TMembers> { 
    readonly alias?: string;
    readonly with?: With<TModel, TMembers, ViewArgsImpl<TModel, TMembers>>;
};

export type MakeEmbeddedDataType<
    TEmbeddedArgs,
    TModel extends AnyModel,
    TMembers, 
    TViewNullType extends ViewNullType
> =
    TEmbeddedArgs extends With<TModel, TMembers, infer NestedArgs>
        ? ViewTypeImpl<TModel, NestedArgs, TMembers, TViewNullType>
    : TEmbeddedArgs extends { with: With<TModel, TMembers, infer NestedArgs> }
        ? ViewTypeImpl<TModel, NestedArgs, TMembers, TViewNullType>
    : ViewTypeImpl<TModel, TMembers, TMembers, TViewNullType>;

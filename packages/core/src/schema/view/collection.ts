import { EntityTable, Predicate } from "@/dsl";
import { AllModelMembers, AnyModel } from "../model";
import { ModelOrder } from "../order";
import { ViewArgs, ViewType } from ".";
import { With } from "./common";
import { ViewNullType } from "../dto";
import { AllScalarsViewType } from "./all_scalars";

export type CollectionPropArgs<
    TModel extends AnyModel
> =
    true 
    | With<ViewArgs<TModel>>
    | CollectionPropArgsImpl<TModel>;

interface CollectionPropArgsImpl<
    TTargetModel extends AnyModel
> {
    readonly alias?: string;
    readonly where?: (table: EntityTable<TTargetModel>) => Predicate;
    readonly orderBy?: ReadonlyArray<ModelOrder<TTargetModel>>;
    readonly limit?: number;
    readonly with?: With<ViewArgs<TTargetModel>>;
}

export type MakeCollectionDataType<
    TCollectionArgs,
    TModel extends AnyModel,
    TViewNullType extends ViewNullType
> =
    TCollectionArgs extends With<infer NestedArgs>
        ? CollectionDataTypeImpl<NestedArgs, TModel, TViewNullType>
    : TCollectionArgs extends { with: With<infer NestedArgs> }
        ? CollectionDataTypeImpl<NestedArgs, TModel, TViewNullType>
    : CollectionDataTypeImpl<true, TModel, TViewNullType>;

type CollectionDataTypeImpl<TCollectionArgs, TModel extends AnyModel, TViewNullType extends ViewNullType> =
    Array<CollectionDataElmentType<TCollectionArgs, TModel, TViewNullType>>;

type CollectionDataElmentType<TCollectionArgs, TModel extends AnyModel, TViewNullType extends ViewNullType> =
    TCollectionArgs extends true
        ? AllScalarsViewType<true, AllModelMembers<TModel>, TViewNullType>
        : ViewType<TModel, TCollectionArgs, TViewNullType>;

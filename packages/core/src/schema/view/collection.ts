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
    | With<TModel, AllModelMembers<TModel>, "ENTITY", ViewArgs<TModel>>
    | CollectionPropArgsImpl<TModel>;

interface CollectionPropArgsImpl<
    TModel extends AnyModel
> {
    readonly alias?: string;
    readonly where?: (table: EntityTable<TModel>) => Predicate;
    readonly orderBy?: ReadonlyArray<ModelOrder<TModel>>;
    readonly limit?: number;
    readonly with?: With<TModel, AllModelMembers<TModel>, "ENTITY", ViewArgs<TModel>>;
}

export type MakeCollectionDataType<
    TCollectionArgs,
    TModel extends AnyModel,
    TViewNullType extends ViewNullType
> =
    TCollectionArgs extends With<TModel, AllModelMembers<TModel>, "ENTITY", infer NestedArgs>
        ? CollectionDataTypeImpl<NestedArgs, TModel, TViewNullType>
    : TCollectionArgs extends { with: With<TModel, AllModelMembers<TModel>, "ENTITY", infer NestedArgs> }
        ? CollectionDataTypeImpl<NestedArgs, TModel, TViewNullType>
    : CollectionDataTypeImpl<true, TModel, TViewNullType>;

type CollectionDataTypeImpl<TCollectionArgs, TModel extends AnyModel, TViewNullType extends ViewNullType> =
    Array<CollectionDataElmentType<TCollectionArgs, TModel, TViewNullType>>;

type CollectionDataElmentType<TCollectionArgs, TModel extends AnyModel, TViewNullType extends ViewNullType> =
    TCollectionArgs extends true
        ? AllScalarsViewType<true, AllModelMembers<TModel>, TViewNullType>
        : ViewType<TModel, TCollectionArgs, TViewNullType>;

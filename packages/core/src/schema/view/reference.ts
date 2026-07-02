import { EntityTable, Predicate } from "@/dsl";
import { ViewArgs, ViewType } from ".";
import { ViewNullType } from "../dto";
import { AllModelMembers, AnyModel } from "../model";
import { ReferenceFetchType } from "../output_dto";
import { AllScalarsViewType } from "./all_scalars";
import { With } from "./common";

export type ReferencePropArgs<
    TModel extends AnyModel,
> = 
    true 
    | With<ViewArgs<TModel>> 
    | ReferencePropArgsImpl<TModel>;

interface ReferencePropArgsImpl<
    TModel extends AnyModel
> {
    readonly alias?: string;
    readonly fetchType?: ReferenceFetchType;
    readonly where?: (table: EntityTable<TModel>) => Predicate | undefined,
    readonly with?: With<ViewArgs<TModel>>;
}

export type MakeReferenceDataType<
    TReferenceArgs,
    TModel extends AnyModel,
    TViewNullType extends ViewNullType
> =
    TReferenceArgs extends With<infer NestedArgs>
        ? ReferenceDataTypeImpl<NestedArgs, TModel, TViewNullType>
    : TReferenceArgs extends { with: With<infer NestedArgs> }
        ? ReferenceDataTypeImpl<NestedArgs, TModel, TViewNullType>
    : ReferenceDataTypeImpl<true, TModel, TViewNullType>;

type ReferenceDataTypeImpl<TReferenceArgs, TModel extends AnyModel, TViewNullType extends ViewNullType> =
    TReferenceArgs extends true
        ? AllScalarsViewType<true, AllModelMembers<TModel>, TViewNullType>
        : ViewType<TModel, TReferenceArgs, TViewNullType>;
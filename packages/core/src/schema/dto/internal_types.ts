import { Prettify } from "@/utils";
import { AnyModel } from "../model";
import { AllModelMembers } from "../model_internal_types";
import { View } from "./api";
import { DtoBody, DtoMapping, DtoType } from "./dto_context";

export * from "./all_scalars";
export * from "./associated_keys";
export * from "./calculator";
export * from "./collection";
export * from "./direct";
export * from "./dto_context";
export * from "./embedded";
export * from "./flat";
export * from "./fold";
export * from "./instance_of";
export * from "./recursive";
export * from "./reference_key";
export * from "./reference";
export * from "./scalar_like";
export * from "./utils";

export type ViewCreator = {
    
    <
        TModel extends AnyModel,
        const TMappings extends ReadonlyArray<
            DtoMapping<TModel>
        >,
    >(
        model: TModel,
        fn: DtoBody<TModel, "NULL_VIEW", "ENTITY", AllModelMembers<TModel>, TMappings>
    ): View<
        TModel, 
        Prettify<DtoType<TMappings>>
    >;

    nullAsUndefined<
        TModel extends AnyModel,
        const TMappings extends ReadonlyArray<
            DtoMapping<TModel>
        >,
    >(
        model: TModel,
        fn: DtoBody<TModel, "UNDEFINED_VIEW", "ENTITY", AllModelMembers<TModel>, TMappings>
    ): View<
        TModel, 
        Prettify<DtoType<TMappings>>
    >;
};

export type ModelOf<T> =
    T extends View<infer R, any>
        ? R
        : never;

export type ViewNullType = "NULL" | "UNDEFINED";
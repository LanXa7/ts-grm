import { Prettify } from "@/utils";
import { AnyModel } from "../model";
import { __AllModelMembers } from "../model_internal_types";
import { View } from "./api";
import { __DtoBody, __DtoMapping, __DtoType } from "./dto_context";

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

export type __ViewCreator = {
    
    <
        TModel extends AnyModel,
        const TMappings extends ReadonlyArray<
            __DtoMapping<TModel>
        >,
    >(
        model: TModel,
        fn: __DtoBody<TModel, "NULL_VIEW", "ENTITY", __AllModelMembers<TModel>, TMappings>
    ): View<
        TModel, 
        Prettify<__DtoType<TMappings>>
    >;

    nullAsUndefined<
        TModel extends AnyModel,
        const TMappings extends ReadonlyArray<
            __DtoMapping<TModel>
        >,
    >(
        model: TModel,
        fn: __DtoBody<TModel, "UNDEFINED_VIEW", "ENTITY", __AllModelMembers<TModel>, TMappings>
    ): View<
        TModel, 
        Prettify<__DtoType<TMappings>>
    >;
};

export type __ModelOf<T> =
    T extends View<infer R, any>
        ? R
        : never;

export type __ViewNullType = "NULL" | "UNDEFINED";
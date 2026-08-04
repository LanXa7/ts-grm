import { StandardSchemaV1 } from "@standard-schema/spec";
import { AnyModel } from "../model";
import { __DtoKind } from "./dto_context";
import { __NullityType } from "../prop_internal_types";
import { __WithNullity } from "./utils";

export type __ScalarLikeMapping<
    TModel extends AnyModel, 
    TDtoKind extends __DtoKind,
    TKey extends string, 
    TValue,
    TNullity extends __NullityType
> =
    TDtoKind extends "INPUT"
        ? __InputScalarLikeMapping<
            TModel, 
            TDtoKind,
            TKey, 
            TValue,
            TNullity
        >
        : __OutputScalarLikeMapping<
            TModel, 
            TDtoKind, 
            TKey, 
            TValue,
            TNullity
        >;

export interface __OutputScalarLikeMapping<
    TModel extends AnyModel, 
    TDtoKind extends __DtoKind,
    TKey extends string, 
    TValue,
    TNullity extends __NullityType
> {

    readonly __mappingType: "SCALAR_LIKE";
    readonly __scalarLikeMappingType: "OUTPUT";
    
    as<TAlias extends string>(
        alias: TAlias
    ): __OutputScalarLikeMapping<TModel, TDtoKind, TAlias, TValue, TNullity>;

    mapOutput<TOutputSchema extends StandardSchemaV1>(
        schema: __RequiredSchema<TOutputSchema>,
        mapper: (
            value: TValue
        ) => StandardSchemaV1.InferOutput<TOutputSchema>
    ): __OutputScalarLikeMapping<TModel, TDtoKind, TKey, StandardSchemaV1.InferOutput<TOutputSchema>, TNullity>;
}

export interface __InputScalarLikeMapping<
    TModel extends AnyModel, 
    TDtoKind extends __DtoKind,
    TKey extends string, 
    TValue,
    TNullity extends __NullityType
> {

    readonly __mappingType: "SCALAR_LIKE";
    readonly __scalarLikeMappingType: "INPUT";
    
    as<TAlias extends string>(
        alias: TAlias
    ): __InputScalarLikeMapping<TModel, TDtoKind, TAlias, TValue, TNullity>;

    mapInput<TInputSchema extends StandardSchemaV1>(
        schema: __RequiredSchema<TInputSchema>,
        mapper: (
            value: StandardSchemaV1.InferOutput<TInputSchema>
        ) => TValue
    ): __InputScalarLikeMapping<TModel, TDtoKind, TKey, StandardSchemaV1.InferOutput<TInputSchema>, TNullity>;
}

export type __ScalarLikeDtoType<TMapping> =
    TMapping extends __ScalarLikeMapping<any, infer DtoKind, infer Key, infer Value, infer Nullity>
        ? {
            [K in Key]: __WithNullity<
                Value,
                Nullity,
                DtoKind
            >;
        }
        : never;

type __RequiredSchema<
    TSchema extends StandardSchemaV1
> = 
    __ContainsNullish<StandardSchemaV1.InferOutput<TSchema>> extends true
        ? never
        : TSchema;

type __ContainsNullish<T> = 
    [T] extends [NonNullable<T>] ? false : true;
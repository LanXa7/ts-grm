import { StandardSchemaV1 } from "@standard-schema/spec";
import { AnyModel } from "../model";
import { DtoKind } from "./dto_context";
import { NullityType } from "../prop_internal_types";
import { WithNullity } from "./utils";

export type ScalarLikeMapping<
    TModel extends AnyModel, 
    TDtoKind extends DtoKind,
    TKey extends string, 
    TValue,
    TNullity extends NullityType
> =
    TDtoKind extends "INPUT"
        ? InputScalarLikeMapping<
            TModel, 
            TDtoKind,
            TKey, 
            TValue,
            TNullity
        >
        : OutputScalarLikeMapping<
            TModel, 
            TDtoKind, 
            TKey, 
            TValue,
            TNullity
        >;

interface OutputScalarLikeMapping<
    TModel extends AnyModel, 
    TDtoKind extends DtoKind,
    TKey extends string, 
    TValue,
    TNullity extends NullityType
> {

    readonly __mappingType: "SCALAR_LIKE";
    readonly __scalarLikeMappingType: "OUTPUT";
    
    as<TAlias extends string>(
        alias: TAlias
    ): OutputScalarLikeMapping<TModel, TDtoKind, TAlias, TValue, TNullity>;

    output<TOutputSchema extends StandardSchemaV1>(
        schema: RequiredSchema<TOutputSchema>,
        mapper: (
            value: TValue
        ) => StandardSchemaV1.InferOutput<TOutputSchema>
    ): OutputScalarLikeMapping<TModel, TDtoKind, TKey, StandardSchemaV1.InferOutput<TOutputSchema>, TNullity>;
}

interface InputScalarLikeMapping<
    TModel extends AnyModel, 
    TDtoKind extends DtoKind,
    TKey extends string, 
    TValue,
    TNullity extends NullityType
> {

    readonly __mappingType: "SCALAR_LIKE";
    readonly __scalarLikeMappingType: "INPUT";
    
    as<TAlias extends string>(
        alias: TAlias
    ): InputScalarLikeMapping<TModel, TDtoKind, TAlias, TValue, TNullity>;

    input<TInputSchema extends StandardSchemaV1>(
        schema: RequiredSchema<TInputSchema>,
        mapper: (
            value: StandardSchemaV1.InferOutput<TInputSchema>
        ) => TValue
    ): InputScalarLikeMapping<TModel, TDtoKind, TKey, StandardSchemaV1.InferOutput<TInputSchema>, TNullity>;
}

export type ScalarLikeDtoType<TMapping> =
    TMapping extends ScalarLikeMapping<any, infer DtoKind, infer Key, infer Value, infer Nullity>
        ? {
            [K in Key]: WithNullity<
                Value,
                Nullity,
                DtoKind
            >;
        }
        : never;

type RequiredSchema<
    TSchema extends StandardSchemaV1
> = 
    ContainsNullish<StandardSchemaV1.InferOutput<TSchema>> extends true
        ? never
        : TSchema;

type ContainsNullish<T> = 
    [T] extends [NonNullable<T>] ? false : true;
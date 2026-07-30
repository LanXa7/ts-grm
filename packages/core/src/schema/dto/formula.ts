import { StandardSchemaV1 } from "@standard-schema/spec";
import { SqlFormulaFn, TsFormulaFn } from "../computed";
import { AnyModel } from "../model";
import { __ContextKind, __DtoBody, __DtoContext, __DtoKind, __DtoMapping, __DtoType } from "./dto_context";
import { IsNull } from "@/dsl/utils";
import { __NullityType } from "../prop_internal_types";
import { __WithNullity } from "./utils";
import { __ScalarLikeMapping } from "./scalar_like";

export type __FormulaContext<
    TModel extends AnyModel,
    TDtoKind extends __DtoKind,
    TContextKind extends __ContextKind,
    TMembers
> = 
    TDtoKind extends "INPUT"
        ? object
        : __FormulaContextImpl<TModel, TDtoKind, TContextKind, TMembers>;

export interface __FormulaContextImpl<
    TModel extends AnyModel,
    TDtoKind extends __DtoKind,
    TContextKind extends __ContextKind,
    TMembers
> {
    readonly $formula: __FormulaCreator<TModel, TDtoKind, TContextKind, TMembers>;
}

export interface __FormulaCreator<
    TModel extends AnyModel,
    TDtoKind extends __DtoKind,
    TContextKind extends __ContextKind,
    TMembers
> {
    ts<
        TAlias extends string,
        TValueType extends StandardSchemaV1,
        const TMappings extends ReadonlyArray<__DtoMapping<TModel>>, 
    >(
        options: __TsFormulaMappingOptions<
            TModel,
            TDtoKind,
            TContextKind,
            TMembers,
            TAlias,
            TValueType,
            TMappings
        >
    ): __ScalarLikeMapping<
        TModel,
        TDtoKind,
        TAlias,
        NonNullable<StandardSchemaV1.InferOutput<TValueType>>,
        IsNull<StandardSchemaV1.InferOutput<TValueType>> extends true
            ? "NULLABLE"
            : "NONNULL"
    >;

    sql<
        TAlias extends string,
        TValueType extends StandardSchemaV1,
    >(
        options: __SqlFormulaMappingOptions<
            TModel,
            TAlias,
            TValueType
        >
    ): __ScalarLikeMapping<
        TModel,
        TDtoKind,
        TAlias,
        NonNullable<StandardSchemaV1.InferOutput<TValueType>>,
        IsNull<StandardSchemaV1.InferOutput<TValueType>> extends true
            ? "NULLABLE"
            : "NONNULL"
    >;
}

export interface __TsFormulaMappingOptions<
    TModel extends AnyModel,
    TDtoKind extends __DtoKind,
    TContextKind extends __ContextKind,
    TMembers,
    TAlias extends string,
    TValueType extends StandardSchemaV1,
    TMappings extends ReadonlyArray<__DtoMapping<TModel>>
>{
    readonly alias: TAlias;
    readonly valueType: TValueType;
    readonly dependency: __DtoBody<TModel, TDtoKind, TContextKind, TMembers, TMappings>;
    readonly fn: TsFormulaFn<__DtoType<TMappings>, StandardSchemaV1.InferOutput<TValueType>>;
}

export interface __SqlFormulaMappingOptions<
    TModel extends AnyModel,
    TAlias extends string,
    TValueType extends StandardSchemaV1
> {
    readonly alias: TAlias;
    readonly valueType: TValueType,
    readonly fn: SqlFormulaFn<TModel, StandardSchemaV1.InferOutput<TValueType>>
}

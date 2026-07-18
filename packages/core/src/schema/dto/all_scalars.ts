import { AtLeastOne } from "@/dsl/utils";
import { AnyModel } from "../model";
import { __EmbeddedPropContract, __ScalarPropContract } from "../prop_internal_types";
import { __DtoKind } from "./dto_context";
import { __WithNullity } from "./utils";

export type __AllScalarsContext<
    TModel extends AnyModel,
    TDtoKind extends __DtoKind,
    TMembers
> = {
    $allScalars: __AllScalarsMapping<TModel, TDtoKind, TMembers, never>;
}

export interface __AllScalarsMapping<
    TModel extends AnyModel,
    TDtoKind extends __DtoKind,
    TMembers, 
    TExcludedKeys extends keyof TMembers
> {
    readonly __mappingType: 'ALL_SCALARS';
    readonly __model?: TModel;
    readonly __members?: TMembers;
    readonly __excludedKeys?: TExcludedKeys;

    exclude<const TExcludedKeys extends AtLeastOne<__ScalarKeys<TMembers>>>(
        ...keys: TExcludedKeys
    ): __AllScalarsMapping<
        TModel,
        TDtoKind,
        TMembers,
        TExcludedKeys[number]
    >;
}

type __ScalarKeys<TMembers> = 
    keyof {
        [K in keyof TMembers as 
            TMembers[K] extends __ScalarPropContract<any, any>
                ? K
            : TMembers[K] extends __EmbeddedPropContract<any, any, any>
                ? K
            : never
        ]: never
    } & string;

export type __AllScalarsDtoType<TMapping> =
    TMapping extends __AllScalarsMapping<any, infer DtoKind, infer Members, infer ExcludedKeys>
        ? { 
            [
                K in __ScalarKeys<Members> as 
                    K extends ExcludedKeys
                        ? never
                        : K
            ]: 
            __MemberType<Members[K], DtoKind> 
        }
        : never;

export type __MemberType<
    TMember, 
    TDtoKind extends __DtoKind
> =
    TMember extends __ScalarPropContract<infer R, infer Nullity>
        ? __WithNullity<R, Nullity, TDtoKind>
    : TMember extends __EmbeddedPropContract<infer NestedProps, infer Nullity, any>
        ? __WithNullity<
            __DefaultEmbeddedType<NestedProps, TDtoKind>,
            Nullity,
            TDtoKind
        >
    : never;
    
export type __DefaultEmbeddedType<
    TProps,
    TDtoKind extends __DtoKind
> = {
    [K in keyof TProps]: __MemberType<TProps[K], TDtoKind>;
};
    
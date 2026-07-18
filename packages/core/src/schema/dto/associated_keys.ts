import { AnyModel } from "../model";
import { __AllModelMembers, __RequiredModelKey } from "../model_internal_types";
import { __CollectionPropContract } from "../prop_internal_types";
import { __MemberType } from "./all_scalars";
import { __DtoKind } from "./dto_context";

export interface __AssociatedKeysContext<
    TModel extends AnyModel,
    TDtoKind extends __DtoKind,
    TMembers
> {
    $associatedKeys<
        TKey extends __CollectionKeys<TMembers>,
        TAlias extends string
    >(
        key: TKey, 
        alias: TAlias
    ): __AssociatedKeysMapping<
        TModel, 
        TDtoKind,
        TAlias, 
        TMembers[TKey]
    >;
}

export type __CollectionKeys<TMembers> = 
    keyof {
        [
            K in keyof TMembers as 
                TMembers[K] extends __CollectionPropContract<any, any, any, any, any>
                    ? K
                    : never
        ]: never
    };

export interface __AssociatedKeysMapping<
    TModel extends AnyModel, 
    TDtoKind extends __DtoKind,
    TKey extends string, 
    TMember
> {

    readonly __mappingType: "ASSOCIATED_KEYS";
    readonly __model?: TModel;
    readonly __dtoKind?: TDtoKind;
    readonly __key?: TKey;
    readonly __member?: TMember;
}

export type __AssociatedKeysDtoType<TMapping> = 
    TMapping extends __AssociatedKeysMapping<any, infer DtoKind, infer Key, infer Member>
        ? {
            [K in Key]: Member extends __CollectionPropContract<infer TargetModel, any, any, any, infer TargetKey>
                ? ReadonlyArray<
                    __MemberType<
                        __AllModelMembers<TargetModel>[__RequiredModelKey<TargetModel, TargetKey>], 
                        DtoKind
                    >
                >
                : never
        }
        : never;
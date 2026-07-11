import { AllModelMembers, AnyModel, RequiredModelKey } from "../model";
import { CollectionPropContract } from "../prop_contract";
import { MemberType } from "./all_scalars";
import { DtoKind } from "./dto_context";

export interface AssociatedKeysContext<
    TModel extends AnyModel,
    TDtoKind extends DtoKind,
    TMembers
> {
    $associatedKeys<
        TKey extends CollectionKeys<TMembers>,
        TAlias extends string
    >(
        key: TKey, 
        alias: TAlias
    ): AssociatedKeysMapping<
        TModel, 
        TDtoKind,
        TAlias, 
        TMembers[TKey]
    >;
}

type CollectionKeys<TMembers> = 
    keyof {
        [
            K in keyof TMembers as 
                TMembers[K] extends CollectionPropContract<any, any, any, any, any>
                    ? K
                    : never
        ]: never
    };

export interface AssociatedKeysMapping<
    TModel extends AnyModel, 
    TDtoKind extends DtoKind,
    TKey extends string, 
    TMember
> {

    readonly __mappingType: "ASSOCIATED_KEYS";
    readonly __model?: TModel;
    readonly __dtoKind?: TDtoKind;
    readonly __key?: TKey;
    readonly __member?: TMember;
}

export type AssociatedKeysDtoType<TMapping> = 
    TMapping extends AssociatedKeysMapping<any, infer DtoKind, infer Key, infer Member>
        ? {
            [K in Key]: Member extends CollectionPropContract<infer TargetModel, any, any, any, infer TargetKey>
                ? ReadonlyArray<
                    MemberType<
                        AllModelMembers<TargetModel>[RequiredModelKey<TargetModel, TargetKey>], 
                        DtoKind
                    >
                >
                : never
        }
        : never;
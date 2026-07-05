import { ViewNullType } from "../dto";
import { AllModelMembers, AnyModel, RequiredModelKey } from "../model";
import { CollectionPropContract, ReferencePropContract } from "../prop_contract";
import { ActionKeys, PropType, TypeWithNullity } from "./common";

export type AssociatedKeysArgs<TMembers> =
    {
        readonly [
            K in keyof TMembers as 
                TMembers[K] extends ActionKeys
                    ? never
                : TMembers[K] extends ReferencePropContract<any, any, any, any, any, any>
                    ? K
                : TMembers[K] extends CollectionPropContract<any, any, any, any, any>
                    ? K
                : never
        ]?: TMembers[K] extends ReferencePropContract<any, any, any, any, any, any>
            ? true | { readonly alias?: string; }
        : TMembers[K] extends CollectionPropContract<any, any, any, any, any>
            ? { readonly alias: string; }
        : never
    };

export type AssociatedKeyTypeRef<TViewArgs, TMembers, TViewNullType extends ViewNullType> = 
    TViewArgs extends { $associatedKeys: infer AssociatedKeysArgs }
        ? { 
            [
                K in keyof AssociatedKeysArgs as
                    AssociatedKeysArgs[K] extends { alias: infer Alias extends string }
                        ? Alias
                        : `${K & string}${Capitalize<DefaultTargetKey<K & keyof TMembers, TMembers>>}`
            ]: AssociatedKeyType<K & keyof TMembers, TMembers, TViewNullType>;
        }
        : object;

type DefaultTargetKey<TKey extends keyof TMembers, TMembers> = 
    TMembers[TKey] extends ReferencePropContract<infer TargetModel, any, any, any, any, infer TargetKey>
        ? RequiredModelKey<TargetModel, TargetKey>
    : TMembers[TKey] extends CollectionPropContract<infer TargetModel, any, any, any, infer TargetKey>
        ? RequiredModelKey<TargetModel, TargetKey>
    : never;

type AssociatedKeyType<TKey extends keyof TMembers, TMembers, TViewNullType extends ViewNullType> =
    TMembers[TKey] extends ReferencePropContract<infer TargetModel, infer Nullity, any, any, any, infer TargetKey>
        ? TypeWithNullity< 
            PropType<
                RequiredModelKey<TargetModel, TargetKey>,
                true,
                TargetModel,
                AllModelMembers<TargetModel>,
                TViewNullType
            >,
            Nullity,
            TViewNullType
        >
    : TMembers[TKey] extends CollectionPropContract<infer TargetModel, any, any, any, infer TargetKey>
        ? ReadonlyArray<
            PropType<
                RequiredModelKey<TargetModel, TargetKey>,
                true,
                TargetModel,
                AllModelMembers<TargetModel>,
                TViewNullType
            >
        >
    : never;

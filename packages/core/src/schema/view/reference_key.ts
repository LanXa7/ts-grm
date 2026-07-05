import { ViewNullType } from "../dto";
import { AllModelMembers, RequiredModelKey } from "../model";
import { ReferencePropContract } from "../prop_contract";
import { PropType, TypeWithNullity } from "./common";

export type ReferenceKeyAssociations<TMembers> = {
    [
        K in keyof TMembers as
            TMembers[K] extends ReferencePropContract<infer TargetModel, any, any, any, any, infer TargetKey>
                ? `${K & string}${Capitalize<RequiredModelKey<TargetModel, TargetKey>>}` 
                : never
    ]: TMembers[K];
};

export type ReferenceKeys<TMembers> = keyof ReferenceKeyAssociations<TMembers>;

export type ReferenceKeysArgs<TMembers> = {
    [
        K in keyof ReferenceKeyAssociations<TMembers>
    ]?: ReferenceKeyAssociations<TMembers>[K] extends ReferencePropContract<any, any, any, any, any, any>
        ? true | { readonly alias?: string }
        : never;
};

export type RefereenceKeyPropType<
    TKey, 
    TArgs, 
    TMembers, 
    TViewNullType extends ViewNullType
> = 
    ReferenceKeyAssociations<TMembers>[
        TKey & keyof ReferenceKeyAssociations<TMembers>
    ] extends ReferencePropContract<infer TargetModel, infer Nullity, any, any, any, infer TargetKey>
        ? TypeWithNullity<
            PropType<
                RequiredModelKey<TargetModel, TargetKey>,
                TArgs,
                TargetModel,
                AllModelMembers<TargetModel>,
                TViewNullType
            >,
            Nullity,
            TViewNullType
        >
        : never;
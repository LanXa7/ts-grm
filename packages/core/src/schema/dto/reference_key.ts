import { AllModelMembers, AnyModel, RequiredModelKey } from "../model";
import { ReferencePropContract } from "../prop_contract";
import { MemberType } from "./all_scalars";
import { DtoKind } from "./dto_context";
import { WithNullity } from "./utils";

export type ReferenceKeyContext<
    TModel extends AnyModel,
    TDtoKind extends DtoKind,
    TMembers
> = {
    [
        K in keyof TMembers as 
            ReferenceKeyName<K, TMembers[K]>
    ]: ReferenceKeyMapping<
        TModel, 
        TDtoKind, 
        ReferenceKeyName<K, TMembers[K]>, 
        TMembers[K]
    >
}

type ReferenceKeyName<TKey, TMember> =
    TMember extends ReferencePropContract<infer TargetModel, any, any, any, any, infer TargetKey>
        ? `${TKey & string}${Capitalize<RequiredModelKey<TargetModel, TargetKey>>}`
        : never;

export interface ReferenceKeyMapping<
    TModel extends AnyModel, 
    TDtoKind extends DtoKind,
    TKey extends string, 
    TMember
> {

    readonly __mappingType: "REFERENCE_KEY";
    
    readonly __key?: TKey;
    
    as<TAlias extends string>(
        alias: TAlias
    ): ReferenceKeyMapping<TModel, TDtoKind, TAlias, TMember>;
}

export type ReferenceKeyDtoType<TMapping> =
    TMapping extends ReferenceKeyMapping<any, infer DtoKind, infer Key, infer Member>
        ? {
            [K in Key]: Member extends ReferencePropContract<infer TargetModel, infer Nullity, any, any, any, infer TargetKey>
                ? WithNullity<
                    MemberType<
                        AllModelMembers<TargetModel>[RequiredModelKey<TargetModel, TargetKey>], 
                        DtoKind
                    >,
                    Nullity,
                    DtoKind
                >
                : never
        }
        : never;


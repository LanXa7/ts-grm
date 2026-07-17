import { AnyModel } from "../model";
import { AllModelMembers, RequiredModelKey } from "../model_internal_types";
import { EmbeddedPropContract, ReferencePropContract } from "../prop_internal_types";
import { AllScalarsMapping, MemberType } from "./all_scalars";
import { DtoBody, DtoKind, DtoMapping, DtoType } from "./dto_context";
import { TargetMappings, PropModelOf, WithNullity } from "./utils";

export type ReferenceKeyContext<
    TModel extends AnyModel,
    TDtoKind extends DtoKind,
    TMembers
> = {
    [
        K in keyof TMembers as 
            ReferenceKeyName<K, TMembers[K]>
    ]: TargetKeyPropOf<TModel, TMembers[K]> extends EmbeddedPropContract<any, any, any>
        ? EmbeddedReferenceKeyMapping<
            TModel, 
            TDtoKind, 
            ReferenceKeyName<K, TMembers[K]>, 
            TMembers[K],
            [AllScalarsMapping<TModel, TDtoKind, TargetKeyMembersOf<TModel, TMembers[K]>, never>]
        >
        : ScalarReferenceKeyMapping<
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

export type ReferenceKeyMapping<
    TModel extends AnyModel, 
    TDtoKind extends DtoKind,
    TKey extends string, 
    TMember
> =
    ScalarReferenceKeyMapping<TModel, TDtoKind, TKey, TMember>
    | EmbeddedReferenceKeyMapping<TModel, TDtoKind, TKey, TMember, any>;

export interface ScalarReferenceKeyMapping<
    TModel extends AnyModel, 
    TDtoKind extends DtoKind,
    TKey extends string, 
    TMember
> {

    readonly __mappingType: "REFERENCE_KEY";

    readonly __keyType: "SCALAR";
    
    readonly __key?: TKey;
    
    as<TAlias extends string>(
        alias: TAlias
    ): ScalarReferenceKeyMapping<TModel, TDtoKind, TAlias, TMember>;
}

export interface EmbeddedReferenceKeyMapping<
    TModel extends AnyModel, 
    TDtoKind extends DtoKind,
    TKey extends string, 
    TMember,
    TMappings extends ReadonlyArray<DtoMapping<any>>
> {

    readonly __mappingType: "REFERENCE_KEY";

    readonly __keyType: "EMBEDDED";
    
    readonly __key?: TKey;
    
    as<TAlias extends string>(
        alias: TAlias
    ): EmbeddedReferenceKeyMapping<TModel, TDtoKind, TAlias, TMember, TMappings>;

    with<
        const TMappings extends TargetMappings<TModel, TMember>
    >(
        body: DtoBody<
            PropModelOf<TModel, TMember>, 
            TDtoKind, 
            "EMBEDDABLE", 
            TargetKeyMembersOf<TModel, TMember>,
            TMappings
        >
    ): EmbeddedReferenceKeyMapping<TModel, TDtoKind, TKey, TMember, TMappings>;
}

type TargetKeyOf<TMember> =
    TMember extends ReferencePropContract<infer TargetModel, any, any, any, any, infer TargetKey>
        ? RequiredModelKey<TargetModel, TargetKey>
        : never;

type TargetKeyPropOf<
    TModel extends AnyModel,
    TMember
> =
    AllModelMembers<
        PropModelOf<TModel, TMember>
    >[TargetKeyOf<TMember>];

type TargetKeyMembersOf<
    TModel extends AnyModel,
    TMember
> =
    TargetKeyPropOf<TModel, TMember> extends EmbeddedPropContract<infer Props, any, any>
        ? Props
        : never;

export type ReferenceKeyDtoType<TMapping> =
    TMapping extends ScalarReferenceKeyMapping<any, infer DtoKind, infer Key, infer Member>
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
    : TMapping extends EmbeddedReferenceKeyMapping<any, infer DtoKind, infer Key, infer Member, infer Mappings>
        ? {
            [K in Key]: Member extends ReferencePropContract<any, infer Nullity, any, any, any, any>
                ? WithNullity<
                    DtoType<Mappings>,
                    Nullity,
                    DtoKind
                >
                : never
        }
        : never;


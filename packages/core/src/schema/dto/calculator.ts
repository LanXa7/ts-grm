import { AnyModel } from "../model";
import { 
    NullityType, 
    ParameterizedCalculatedCollectionPropContract, 
    ParameterizedCalculatedReferencePropContract, 
    ParameterizedCalculatedValuePropContract 
} from "../prop_contract";
import { DtoBody, DtoKind, DtoType } from "./dto_context";
import { ScalarLikeMapping } from "./scalar_like";
import { DefaultTargetMappings, TargetMappings, TargetMembersOf, TargetModelOf, WithNullity } from "./utils";

export type ParameterizedContext<
    TModel extends AnyModel,
    TDtoKind extends DtoKind,
    TMembers
> = 
    TDtoKind extends "INPUT"
        ? object
        : ParameterizedContextImpl<
            TModel,
            TDtoKind,
            TMembers,
            ParameterMap<TMembers>
        >;

interface ParameterizedContextImpl<
    TModel extends AnyModel,
    TDtoKind extends DtoKind,
    TMembers,
    TParameterMap
> {
    $parameterized<
        TKey extends keyof TParameterMap
    >(
        key: TKey,
        parameter: TParameterMap[TKey]
    ): TMembers[TKey & keyof TMembers] extends ParameterizedCalculatedValuePropContract<any, infer Value, infer Nullity>
        ? ScalarLikeMapping<
            TModel, 
            TDtoKind, 
            TKey & string, 
            Value, 
            Nullity
        >
    : TMembers[TKey & keyof TMembers] extends ParameterizedCalculatedReferencePropContract<any, any, infer Nullity>
        ? CalculatedReferenceMapping<
            TModel, 
            TDtoKind,
            TKey & string,
            TMembers[TKey & keyof TMembers],
            DefaultTargetMappings<TModel, TDtoKind, TMembers[TKey & keyof TMembers]>,
            Nullity
        >
    : TMembers[TKey & keyof TMembers] extends ParameterizedCalculatedCollectionPropContract<any, any>
        ? CalculatedCollectionMapping<
            TModel, 
            TDtoKind,
            TKey & string,
            TMembers[TKey & keyof TMembers],
            DefaultTargetMappings<TModel, TDtoKind, TMembers[TKey & keyof TMembers]>
        >
    : never;
}

type ParameterMap<TMembers> = {
    [
        K in keyof TMembers as 
            TMembers[K] extends ParameterizedCalculatedValuePropContract<any, any, any>
                ? K
            : TMembers[K] extends ParameterizedCalculatedReferencePropContract<any, any, any>
                ? K
            : TMembers[K] extends ParameterizedCalculatedCollectionPropContract<any, any>
                ? K
            : never
    ]: TMembers[K] extends ParameterizedCalculatedValuePropContract<infer Parameter, any, any>
            ? Parameter
        : TMembers[K] extends ParameterizedCalculatedReferencePropContract<infer Parameter, any, any>
            ? Parameter
        : TMembers[K] extends ParameterizedCalculatedCollectionPropContract<infer Parameter, any>
            ? Parameter
        : never
};

export interface CalculatedReferenceMapping<
    TModel extends AnyModel,
    TDtoKind extends DtoKind,
    TKey extends string,
    TMember,
    TMappings extends TargetMappings<TModel, TMember>,
    TNullity extends NullityType
> {

    readonly __mappingType: "CALCULATED_REFERENCE";
    
    as<TAlias extends string>(
        alias: TAlias
    ): CalculatedReferenceMapping<TModel, TDtoKind, TAlias, TMember, TMappings, TNullity>;

    with<const TMappings extends TargetMappings<TModel, TMember>>(
        body: DtoBody<TargetModelOf<TModel, TMember>, TDtoKind, "ENTITY", TargetMembersOf<TMember>, TMappings>
    ): CalculatedReferenceMapping<TModel, TDtoKind, TKey, TMember, TMappings, TNullity>;
}

export interface CalculatedCollectionMapping<
    TModel extends AnyModel,
    TDtoKind extends DtoKind,
    TKey extends string,
    TMember,
    TMappings extends TargetMappings<TModel, TMember>
> {

    readonly __mappingType: "CALCULATED_COLLECTION";
    
    as<TAlias extends string>(
        alias: TAlias
    ): CalculatedCollectionMapping<TModel, TDtoKind, TAlias, TMember, TMappings>;

    with<const TMappings extends TargetMappings<TModel, TMember>>(
        body: DtoBody<TargetModelOf<TModel, TMember>, TDtoKind, "ENTITY", TargetMembersOf<TMember>, TMappings>
    ): CalculatedCollectionMapping<TModel, TDtoKind, TKey, TMember, TMappings>;
}

export type CalculatedReferenceDtoType<TMapping> =
    TMapping extends CalculatedReferenceMapping<any, infer DtoKind, infer Key, any, infer Mappings, infer Nullity>
        ? {
            [K in Key]: WithNullity<
                DtoType<Mappings>,
                Nullity,
                DtoKind
            >
        }
        : never;

export type CalculatedCollectionDtoType<TMapping> =
    TMapping extends CalculatedCollectionMapping<any, any, infer Key, any, infer Mappings>
        ? {
            [K in Key]: ReadonlyArray<
                DtoType<Mappings>
            >
        }
        : never;
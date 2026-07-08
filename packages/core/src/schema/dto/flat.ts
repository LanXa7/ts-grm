import { EntityTable, Predicate } from "@/dsl";
import { AnyModel } from "../model";
import { EmbeddedPropContract, NullityType, ReferencePropContract } from "../prop_contract";
import { DtoBody, DtoType, DtoKind } from "./common";
import { DefaultTargetMappings, NullityOf, TargetMappings, TargetMembersOf, TargetModelOf, WithNullity } from "./utils";
import { ReferenceFetchType } from "./reference_fetch_type";

export interface FlatContext<
    TModel extends AnyModel,
    TDtoKind extends DtoKind,
    TMembers
> {
    $flat<
        TKey extends FlatableKeys<TMembers>
    >(
        key: TKey
    ): TMembers[TKey] extends ReferencePropContract<any, any, any, any, any, any>
        ? ReferenceFlatMapping<
            TModel,
            TDtoKind,
            TKey & string,
            TMembers[TKey],
            DefaultTargetMappings<TModel, TDtoKind, TMembers[TKey]>,
            NullityOf<TMembers[TKey]>
        >
        : EmbeddedFlatMapping<
            TModel,
            TDtoKind,
            TKey & string,
            TMembers[TKey],
            DefaultTargetMappings<TModel, TDtoKind, TMembers[TKey]>,
            NullityOf<TMembers[TKey]>
        >;
}

type FlatableKeys<TMembers> = 
    keyof {
        [
            K in keyof TMembers as
                TMembers[K] extends ReferencePropContract<any, any, any, any, any, any>
                    ? K
                : TMembers[K] extends EmbeddedPropContract<any, any, any>
                    ? K
                : never
        ]: never
    }

export type FlatMapping<
    TModel extends AnyModel,
    TDtoKind extends DtoKind,
    TKey extends string,
    TMember,
    TMappings extends TargetMappings<TModel, TMember>,
    TNullity extends NullityType
> = 
    EmbeddedFlatMapping<
        TModel,
        TDtoKind,
        TKey,
        TMember,
        TMappings,
        TNullity
    > 
    | ReferenceFlatMapping<
        TModel,
        TDtoKind,
        TKey,
        TMember,
        TMappings,
        TNullity
    >


export interface EmbeddedFlatMapping<
    TModel extends AnyModel,
    TDtoKind extends DtoKind,
    TKey extends string,
    TMember,
    TMappings extends TargetMappings<TModel, TMember>,
    TNullity extends NullityType
> {
    readonly __mappingType: 'FLAT';

    readonly __flatType: 'EMBEDDED';
    
    prefix<TPrefix extends string>(
        alias: TPrefix
    ): EmbeddedFlatMapping<TModel, TDtoKind, TPrefix, TMember, TMappings, TNullity>;

    with<const TMappings extends TargetMappings<TModel, TMember>>(
        body: DtoBody<TargetModelOf<TModel, TMember>, TDtoKind, "EMBEDDABLE", TargetMembersOf<TMember>, TMappings>
    ): EmbeddedFlatMapping<TModel, TDtoKind, TKey, TMember, TMappings, TNullity>;
}

export interface ReferenceFlatMapping<
    TModel extends AnyModel,
    TDtoKind extends DtoKind,
    TKey extends string,
    TMember,
    TMappings extends TargetMappings<TModel, TMember>,
    TNullity extends NullityType
> {
    readonly __mappingType: 'FLAT';

    readonly __flatType: 'REFERENCE';

    prefix<TPrefix extends string>(
        alias: TPrefix
    ): ReferenceFlatMapping<TModel, TDtoKind, TPrefix, TMember, TMappings, TNullity>;

    with<const TMappings extends TargetMappings<TModel, TMember>>(
        body: DtoBody<TargetModelOf<TModel, TMember>, TDtoKind, "ENTITY", TargetMembersOf<TMember>, TMappings>
    ): ReferenceFlatMapping<TModel, TDtoKind, TKey, TMember, TMappings, TNullity>;

    where(
        filter: (table: EntityTable<TargetModelOf<TModel, TMember>>) => Predicate | undefined
    ): ReferenceFlatMapping<TModel, TDtoKind, TKey, TMember, TMappings, "NULLABLE">;

    fetch(
        fetchType: ReferenceFetchType
    ): ReferenceFlatMapping<TModel, TDtoKind, TKey, TMember, TMappings, TNullity>;
}

export type FlatDtoType<TMapping> =
    TMapping extends FlatMapping<any, infer DtoKind, infer Key, any, infer Mappings, infer Nullity>
        ? Flat<
            DtoType<Mappings>,
            Key,
            Nullity,
            DtoKind
        >
        : never;

type Flat<
    T, 
    TPrefix extends string, 
    TNullity extends NullityType, 
    TDtoKind extends DtoKind
> = 
    TPrefix extends ""
        ? {
            [K in keyof T]: WithNullity<T[K], TNullity, TDtoKind>
        }
        : {
            [
                K in keyof T as
                    `${TPrefix}${Capitalize<K & string>}`
            ]: WithNullity<T[K], TNullity, TDtoKind>
        };

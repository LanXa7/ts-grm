import { EntityTable, Predicate } from "@/dsl";
import { AnyModel } from "../model";
import { EmbeddedPropContract, NullityType, ReferencePropContract } from "../prop_contract";
import { DtoBody, DtoType, NullityMode } from "./common";
import { DefaultTargetMappings, NullityOf, TargetMappings, TargetMembersOf, TargetModelOf, WithNullity } from "./utils";
import { ReferenceFetchType } from "./reference_fetch_type";

export interface FlatContext<
    TModel extends AnyModel,
    TMembers
> {
    $flat<
        TKey extends FlatableKeys<TMembers>
    >(
        key: TKey
    ): TMembers[TKey] extends ReferencePropContract<any, any, any, any, any, any>
        ? ReferenceFlatMapping<
            TModel,
            TKey & string,
            TMembers[TKey],
            DefaultTargetMappings<TModel, TMembers[TKey]>,
            NullityOf<TMembers[TKey]>
        >
        : EmbeddedFlatMapping<
            TModel,
            TKey & string,
            TMembers[TKey],
            DefaultTargetMappings<TModel, TMembers[TKey]>,
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
    TKey extends string,
    TMember,
    TMappings extends TargetMappings<TModel, TMember>,
    TNullity extends NullityType
> = 
    EmbeddedFlatMapping<
        TModel,
        TKey,
        TMember,
        TMappings,
        TNullity
    > 
    | ReferenceFlatMapping<
        TModel,
        TKey,
        TMember,
        TMappings,
        TNullity
    >


export interface EmbeddedFlatMapping<
    TModel extends AnyModel,
    TKey extends string,
    TMember,
    TMappings extends TargetMappings<TModel, TMember>,
    TNullity extends NullityType
> {
    readonly __mappingType: 'FLAT';

    readonly __flatType: 'EMBEDDED';
    
    prefix<TPrefix extends string>(
        alias: TPrefix
    ): EmbeddedFlatMapping<TModel, TPrefix, TMember, TMappings, TNullity>;

    with<const TMappings extends TargetMappings<TModel, TMember>>(
        body: DtoBody<TargetModelOf<TModel, TMember>, TargetMembersOf<TMember>, "EMBEDDABLE", TMappings>
    ): EmbeddedFlatMapping<TModel, TKey, TMember, TMappings, TNullity>;
}

export interface ReferenceFlatMapping<
    TModel extends AnyModel,
    TKey extends string,
    TMember,
    TMappings extends TargetMappings<TModel, TMember>,
    TNullity extends NullityType
> {
    readonly __mappingType: 'FLAT';

    readonly __flatType: 'REFERENCE';

    prefix<TPrefix extends string>(
        alias: TPrefix
    ): ReferenceFlatMapping<TModel, TPrefix, TMember, TMappings, TNullity>;

    with<const TMappings extends TargetMappings<TModel, TMember>>(
        body: DtoBody<TargetModelOf<TModel, TMember>, TargetMembersOf<TMember>, "ENTITY", TMappings>
    ): ReferenceFlatMapping<TModel, TKey, TMember, TMappings, TNullity>;

    where(
        filter: (table: EntityTable<TargetModelOf<TModel, TMember>>) => Predicate | undefined
    ): ReferenceFlatMapping<TModel, TKey, TMember, TMappings, "NULLABLE">;

    fetch(
        fetchType: ReferenceFetchType
    ): ReferenceFlatMapping<TModel, TKey, TMember, TMappings, TNullity>;
}

export type FlatDtoType<
    TMapping, 
    TNullityMode extends NullityMode
> =
    TMapping extends FlatMapping<any, infer Key, any, infer Mappings, infer Nullity>
        ? Flat<
            DtoType<Mappings, TNullityMode>,
            Key,
            Nullity,
            TNullityMode
        >
        : never;

type Flat<
    T, 
    TPrefix extends string, 
    TNullity extends NullityType, 
    TNullityMode extends NullityMode
> = 
    TPrefix extends ""
        ? {
            [K in keyof T]: WithNullity<T[K], TNullity, TNullityMode>
        }
        : {
            [
                K in keyof T as
                    `${TPrefix}${Capitalize<K & string>}`
            ]: WithNullity<T[K], TNullity, TNullityMode>
        };

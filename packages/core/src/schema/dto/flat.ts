import { AnyModel } from "../model";
import { EmbeddedPropContract, ReferencePropContract } from "../prop_contract";
import { DtoBody } from "./common";
import { DefaultTargetMappings, TargetContextKindOf, TargetMappings, TargetMembersOf, TargetModelOf } from "./utils";

export interface FlatContext<
    TModel extends AnyModel,
    TMembers
> {
    flat<
        TKey extends FlatableKeys<TMembers>,
        const TMappings extends TargetMappings<TModel, TMembers[TKey]>
    >(
        key: TKey,
        body: DtoBody<
            TargetModelOf<TModel, TMembers[TKey]>, 
            TargetMembersOf<TMembers[TKey]>, 
            TargetContextKindOf<TMembers[TKey]>, 
            TMappings
        >
    ): FlatMapping<
        TModel,
        TKey & string,
        TMembers[TKey],
        TKey,
        TMappings
    >;

    flat<
        TKey extends FlatableKeys<TMembers>,
        const TPrefix extends string = TKey,
        const TMappings extends TargetMappings<TModel, TMembers[TKey]> = 
            DefaultTargetMappings<TModel, TMembers[TKey]>
    >(
        key: TKey,
        options?: {
            readonly prefix?: TPrefix,
            readonly with?: DtoBody<
                TargetModelOf<TModel, TMembers[TKey]>, 
                TargetMembersOf<TMembers[TKey]>, 
                TargetContextKindOf<TMembers[TKey]>, 
                TMappings
            >
        }
    ): FlatMapping<
        TModel,
        TKey & string,
        TMembers[TKey],
        TPrefix,
        TMappings
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

export interface FlatMapping<
    TModel extends AnyModel,
    TKey,
    TMember,
    TPrefix extends string,
    TMappings extends TargetMappings<TModel, TMember>
> {
    readonly __mappingType: 'FLAT';
    readonly __model?: TModel;
    readonly __name?: TKey;
    readonly __member?: TMember;
    readonly __prefix?: TPrefix;
    readonly __mapping?: TMappings;
}

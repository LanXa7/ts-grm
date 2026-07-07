import { AnyModel } from "../model";
import { CollectionPropContract } from "../prop_contract";

export interface AssociatedKeysContext<
    TModel extends AnyModel,
    TMembers
> {
    associatedKeys<
        TKey extends CollectionKeys<TMembers>,
        TAlias extends string
    >(
        key: TKey, 
        alias: TAlias
    ): AssociatedKeysMapping<
        TModel, 
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
    TKey extends string, 
    TMember
> {

    readonly __mappingType: "ASSOCIATED_KEY";
    readonly __model?: TModel;
    readonly __key?: TKey;
    readonly __member?: TMember;
}

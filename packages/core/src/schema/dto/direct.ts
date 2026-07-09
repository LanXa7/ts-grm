import { AnyModel } from "../model";
import { 
    CalculatedCollectionPropContract, 
    CalculatedReferencePropContract, 
    CalculatedValuePropContract, 
    CollectionPropContract, 
    EmbeddedPropContract, 
    ReferencePropContract, 
    ScalarLikePropContract, 
    ScalarPropContract 
} from "../prop_contract";
import { CalculatedCollectionMapping, CalculatedReferenceMapping, CalculatedValueMapping } from "./calculator";
import { CollectionMapping } from "./collection";
import { DtoKind } from "./common";
import { EmbeddedMapping } from "./embedded";
import { ReferenceMapping } from "./reference";
import { ScalarLikeMapping } from "./scalar_like";
import { DefaultTargetMappings, NullityOf } from "./utils";

export type DirectContext<
    TModel extends AnyModel,
    TDtoKind extends DtoKind,
    TMembers
> = {
    [
        K in keyof TMembers as 
            IsScalarLikeProp<TMembers[K], TDtoKind> extends true
                ? K
            : TMembers[K] extends EmbeddedPropContract<any, any, any>
                ? K
            : TMembers[K] extends ReferencePropContract<any, any, any, any, any, any>
                ? K
            : TMembers[K] extends CollectionPropContract<any, any, any, any, any>
                ? K
            : TMembers[K] extends CalculatedValuePropContract<any, any>
                ? IfView<K, TDtoKind>
            : TMembers[K] extends CalculatedReferencePropContract<any, any>
                ? IfView<K, TDtoKind>
            : TMembers[K] extends CalculatedCollectionPropContract<any>
                ? IfView<K, TDtoKind>
            : never
    ]: 
        IsScalarLikeProp<TMembers[K], TDtoKind> extends true
            ? ScalarLikeMapping<
                TModel, 
                TDtoKind,
                K & string, 
                TMembers[K]
            >
        : TMembers[K] extends EmbeddedPropContract<any, any, any>
            ? EmbeddedMapping<
                TModel, 
                TDtoKind,
                K & string, 
                TMembers[K], 
                DefaultTargetMappings<TModel, TDtoKind, TMembers[K]>
            >
        : TMembers[K] extends ReferencePropContract<any, any, any, any, any, any>
            ? ReferenceMapping<
                TModel, 
                TDtoKind,
                K & string, 
                TMembers[K],
                DefaultTargetMappings<TModel, TDtoKind, TMembers[K]>,
                NullityOf<TMembers[K]>
            >
        : TMembers[K] extends CollectionPropContract<any, any, any, any, any>
            ? CollectionMapping<
                TModel, 
                TDtoKind,
                K & string, 
                TMembers[K],
                DefaultTargetMappings<TModel, TDtoKind, TMembers[K]>
            >
        : TMembers[K] extends CalculatedValuePropContract<infer R, infer Nullity>
            ? IfView<
                CalculatedValueMapping<
                    TModel, 
                    TDtoKind,
                    K & string, 
                    R,
                    Nullity
                >,
                TDtoKind
            >
        : TMembers[K] extends CalculatedReferencePropContract<any, infer Nullity>
            ? IfView<
                CalculatedReferenceMapping<
                    TModel, 
                    TDtoKind,
                    K & string, 
                    TMembers[K],
                    DefaultTargetMappings<TModel, TDtoKind, TMembers[K]>,
                    Nullity
                >,
                TDtoKind
            >
        : TMembers[K] extends CalculatedCollectionPropContract<any>
            ? IfView<
                CalculatedCollectionMapping<
                    TModel, 
                    TDtoKind,
                    K & string, 
                    TMembers[K],
                    DefaultTargetMappings<TModel, TDtoKind, TMembers[K]>
                >,
                TDtoKind
            >
        : never;
}

type IsScalarLikeProp<TMember, TDtoKind extends DtoKind> =
    TDtoKind extends "INPUT"
        ? TMember extends ScalarPropContract<any, any> ? true : false
        : TMember extends ScalarLikePropContract<any, any> ? true : false;

type IfView<T, TDtoKind> = 
    TDtoKind extends "INPUT"
        ? never
        : T;
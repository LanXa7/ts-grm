import { UnionToIntersection } from "@/utils";
import { AnyModel } from "../model";
import { AllScalarsContext, AllScalarsDtoType, AllScalarsMapping } from "./all_scalars";
import { AssociatedKeysContext, AssociatedKeysDtoType, AssociatedKeysMapping } from "./associated_keys";
import { CollectionDtoType, CollectionMapping } from "./collection";
import { EmbeddedDtoType, EmbeddedMapping } from "./embedded";
import { FlatContext, FlatDtoType, FlatMapping } from "./flat";
import { FoldContext, FoldDotType, FoldMapping } from "./fold";
import { ReferenceDtoType, ReferenceMapping } from "./reference";
import { ReferenceKeyContext, ReferenceKeyDtoType, ReferenceKeyMapping } from "./reference_key";
import { ScalarDtoType, ScalarMapping } from "./scalar";
import { DirectContext } from "./direct";
import { ApplyInstanceOfMappings, InstanceOfContext, InstanceOfMappping } from "./instance_of";

export type DtoContext<
    TModel extends AnyModel,
    TDtoKind extends DtoKind,
    TContextKind extends ContextKind,
    TMembers
> = 
    DirectContext<TModel, TDtoKind, TMembers>
    & FoldContext<TModel, TDtoKind, TContextKind, TMembers>
    & FlatContext<TModel, TDtoKind, TMembers>
    & InstanceOfContext<TModel, TDtoKind>
    & (
        TContextKind extends "EMBEDDABLE"
            ? object
            : ReferenceKeyContext<TModel, TDtoKind, TMembers>
    )
    & (
        TContextKind extends "EMBEDDABLE"
            ? object
            : AssociatedKeysContext<TModel, TDtoKind, TMembers>
    )
    & (
        TContextKind extends "DERIVED_ENTITY"
            ? object
            : AllScalarsContext<TModel, TDtoKind, TMembers>
    );

export type ContextKind = "ENTITY" | "EMBEDDABLE" | "DERIVED_ENTITY";

export type DtoKind = "NULL_VIEW" | "UNDEFINED_VIEW" | "INPUT";

export interface DtoBody<
    TModel extends AnyModel,
    TDtoKind extends DtoKind,
    TContextKind extends ContextKind,
    TMembers,
    TMappings extends ReadonlyArray<DtoMapping<TModel>>
> {

    (
        ctx: DtoContext<TModel, TDtoKind, TContextKind, TMembers>
    ): TMappings;
}

export type DtoMapping<
    TModel extends AnyModel
> = 
    AllScalarsMapping<TModel, any, any, any> 
    | FoldMapping<TModel, any, any, any>
    | FlatMapping<TModel, any, any, any, any, any>
    | InstanceOfMappping<TModel, any, any, any>
    | ScalarMapping<TModel, any, any, any>
    | EmbeddedMapping<TModel, any, any, any, any>
    | ReferenceKeyMapping<TModel, any, any, any>
    | AssociatedKeysMapping<TModel, any, any, any>
    | ReferenceMapping<TModel, any, any, any, any, any>
    | CollectionMapping<TModel, any, any, any, any>;

export type DtoType<
    TMappings extends ReadonlyArray<DtoMapping<any>>
> = 
    ApplyInstanceOfMappings<
        UnionToIntersection<{
            [K in keyof TMappings]: DtoMappingType<TMappings[K]>
        }[number]>,
        TMappings
    >;
    
type DtoMappingType<
    TMapping extends DtoMapping<any>
> =
    TMapping["__mappingType"] extends "SCALAR"
        ? ScalarDtoType<TMapping>
    : TMapping["__mappingType"] extends "ALL_SCALARS"
        ? AllScalarsDtoType<TMapping>
    : TMapping["__mappingType"] extends "EMBEDDED"
        ? EmbeddedDtoType<TMapping>
    : TMapping["__mappingType"] extends "REFERENCE"
        ? ReferenceDtoType<TMapping>
    : TMapping["__mappingType"] extends "COLLECTION"
        ? CollectionDtoType<TMapping>
    : TMapping["__mappingType"] extends "REFERENCE_KEY"
        ? ReferenceKeyDtoType<TMapping>
    : TMapping["__mappingType"] extends "ASSOCIATED_KEYS"
        ? AssociatedKeysDtoType<TMapping>
    : TMapping["__mappingType"] extends "FOLD"
        ? FoldDotType<TMapping>
    : TMapping["__mappingType"] extends "FLAT"
        ? FlatDtoType<TMapping>
    : never;
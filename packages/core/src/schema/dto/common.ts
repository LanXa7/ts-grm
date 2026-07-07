import { UnionToIntersection } from "@/utils";
import { AnyModel } from "../model";
import { AllScalarsContext, AllScalarsDtoType, AllScalarsMapping } from "./all_scalars";
import { AssociatedKeysContext, AssociatedKeysMapping } from "./associated_keys";
import { CollectionContext, CollectionDtoType, CollectionMapping } from "./collection";
import { EmbeddedContext, EmbeddedDtoType, EmbeddedMapping } from "./embedded";
import { FlatContext, FlatMapping } from "./flat";
import { FoldContext, FoldMapping } from "./fold";
import { ReferenceContext, ReferenceDtoType, ReferenceMapping } from "./reference";
import { ReferenceKeyContext, ReferenceKeyMapping } from "./reference_key";
import { ScalarContext, ScalarDtoType, ScalarMapping } from "./scalar";

export type DtoContext<
    TModel extends AnyModel,
    TMembers,
    TContextKind extends ContextKind
> = 
    ScalarContext<TModel, TMembers>
    & EmbeddedContext<TModel, TMembers>
    & FoldContext<TModel, TMembers, TContextKind>
    & FlatContext<TModel, TMembers>
    & (
        TContextKind extends "EMBEDDABLE"
            ? object
            : ReferenceContext<TModel, TMembers>
    )
    & (
        TContextKind extends "EMBEDDABLE"
            ? object
            : CollectionContext<TModel, TMembers>
    )
    & (
        TContextKind extends "EMBEDDABLE"
            ? object
            : ReferenceKeyContext<TModel, TMembers>
    )
    & (
        TContextKind extends "EMBEDDABLE"
            ? object
            : AssociatedKeysContext<TModel, TMembers>
    )
    & (
        TContextKind extends "DERIVED_ENTITY"
            ? object
            : AllScalarsContext<TModel, TMembers>
    );

export type ContextKind = "ENTITY" | "EMBEDDABLE" | "DERIVED_ENTITY";

export type NullityMode = "NULL" | "UNDEFINED" | "INPUT_MIXED";

export interface DtoBody<
    TModel extends AnyModel,
    TMembers,
    TContextKind extends ContextKind,
    TMappings extends ReadonlyArray<DtoMapping<TModel>>
> {

    (
        ctx: DtoContext<TModel, TMembers, TContextKind>
    ): TMappings;
}

export type DtoMapping<
    TModel extends AnyModel
> = 
    AllScalarsMapping<TModel, any, any> 
    | FoldMapping<TModel, any, any>
    | FlatMapping<TModel, any, any, any, any>
    | ScalarMapping<TModel, any, any>
    | EmbeddedMapping<TModel, any, any, any>
    | ReferenceKeyMapping<TModel, any, any>
    | AssociatedKeysMapping<TModel, any, any>
    | ReferenceMapping<TModel, any, any, any, any>
    | CollectionMapping<TModel, any, any, any>;

export type DtoType<
    TMappings extends ReadonlyArray<DtoMapping<any>>, 
    TNullityMode extends NullityMode
> = 
    UnionToIntersection<{
        [K in keyof TMappings]: DtoMappingType<TMappings[K], TNullityMode>
    }[number]>;
    
type DtoMappingType<
    TMapping extends DtoMapping<any>, 
    TNullityMode extends NullityMode
> =
    TMapping["__mappingType"] extends "SCALAR"
        ? ScalarDtoType<TMapping, TNullityMode>
    : TMapping["__mappingType"] extends "ALL_SCALARS"
        ? AllScalarsDtoType<TMapping, TNullityMode>
    : TMapping["__mappingType"] extends "EMBEDDED"
        ? EmbeddedDtoType<TMapping, TNullityMode>
    : TMapping["__mappingType"] extends "REFERENCE"
        ? ReferenceDtoType<TMapping, TNullityMode>
    : TMapping["__mappingType"] extends "COLLECTION"
        ? CollectionDtoType<TMapping, TNullityMode>
    : never;
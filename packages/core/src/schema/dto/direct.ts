import { AnyModel } from "../model";
import { CollectionPropContract, EmbeddedPropContract, ReferencePropContract, ScalarPropContract } from "../prop_contract";
import { CollectionMapping } from "./collection";
import { DtoKind } from "./common";
import { EmbeddedMapping } from "./embedded";
import { ReferenceMapping } from "./reference";
import { ScalarMapping } from "./scalar";
import { DefaultTargetMappings, NullityOf } from "./utils";

export type DirectContext<
    TModel extends AnyModel,
    TDtoKind extends DtoKind,
    TMembers
> = {
    [
        K in keyof TMembers as 
            TMembers[K] extends ScalarPropContract<any, any>
                ? K
            : TMembers[K] extends EmbeddedPropContract<any, any, any>
                ? K
            : TMembers[K] extends ReferencePropContract<any, any, any, any, any, any>
                ? K
            : TMembers[K] extends CollectionPropContract<any, any, any, any, any>
                ? K
            : never
    ]: TMembers[K] extends ScalarPropContract<any, any>
            ? ScalarMapping<
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
        : never;
}
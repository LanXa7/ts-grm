import { AtLeastOne } from "@/dsl";
import { AnyModel } from "../model";
import { EmbeddedPropContract, ScalarPropContract } from "../prop_contract";
import { DtoKind } from "./common";
import { WithNullity } from "./utils";

export type AllScalarsContext<
    TModel extends AnyModel,
    TDtoKind extends DtoKind,
    TMembers
> = {
    $allScalars: AllScalarsMapping<TModel, TDtoKind, TMembers, DefaultKeys<TMembers>>;
}

export interface AllScalarsMapping<
    TModel extends AnyModel,
    TDtoKind extends DtoKind,
    TMembers, 
    TKeys extends keyof TMembers
> {
    readonly __mappingType: 'ALL_SCALARS';
    readonly __model?: TModel;
    readonly __members?: TMembers;
    readonly __excludedKeys?: TKeys;

    exclude<const TKeys extends AtLeastOne<DefaultKeys<TMembers>>>(
        ...keys: TKeys
    ): AllScalarsMapping<
        TModel,
        TDtoKind,
        TMembers,
        Exclude<
            DefaultKeys<TMembers>,
            TKeys extends string
                ? TKeys
                : TKeys[number]
        >
    >;
}

export type DefaultKeys<TMembers> = 
    keyof {
        [K in keyof TMembers as 
            TMembers[K] extends ScalarPropContract<any, any>
                ? K
            : TMembers[K] extends EmbeddedPropContract<any, any, any>
                ? K
            : never
        ]: never
    } & string;

export type AllScalarsDtoType<TMapping> =
    TMapping extends AllScalarsMapping<any, infer DtoKind, infer Members, infer Keys>
        ? { [K in Keys]: MemberType<Members[K], DtoKind> }
        : never;

type MemberType<
    TMember, 
    TDtoKind extends DtoKind
> =
    TMember extends ScalarPropContract<infer R, infer Nullity>
        ? WithNullity<R, Nullity, TDtoKind>
    : TMember extends EmbeddedPropContract<infer NestedProps, any, any>
        ? DefaultEmbeddedType<NestedProps, TDtoKind>
    : never;
    
type DefaultEmbeddedType<
    TProps,
    TDtoKind extends DtoKind
> = {
    [K in keyof TProps]: MemberType<TProps[K], TDtoKind>;
};
    
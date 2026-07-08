import { AnyModel } from "../model";
import { EmbeddedPropContract, ScalarPropContract } from "../prop_contract";
import { DtoKind } from "./common";
import { WithNullity } from "./utils";

export type AllScalarsContext<
    TModel extends AnyModel,
    TMembers
> = {

    $allScalars: ConfigurableAllScalarsMapping<TModel, TMembers>;
}

export interface AllScalarsMapping<
    TModel extends AnyModel,
    TMembers, 
    TKeys extends keyof TMembers
> {
    readonly __mappingType: 'ALL_SCALARS';
    readonly __model?: TModel;
    readonly __members?: TMembers;
    readonly __excludedKeys?: TKeys;
}

export interface ConfigurableAllScalarsMapping<
    TModel extends AnyModel,
    TMembers
> extends AllScalarsMapping<TModel, TMembers, DefaultKeys<TMembers>> {

    readonly exclude: DefaultKeys<TMembers> | ReadonlyArray<DefaultKeys<TMembers>> | undefined;

    <const TKeys extends DefaultKeys<TMembers> | ReadonlyArray<DefaultKeys<TMembers>>>(options: {
        readonly exclude: TKeys
    }): AllScalarsMapping<
        TModel,
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

export type AllScalarsDtoType<
    TMapping, 
    TDtoKind extends DtoKind
> =
    TMapping extends AllScalarsMapping<any, infer Members, infer Keys>
        ? { [K in Keys]: MemberType<Members[K], TDtoKind> }
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
    
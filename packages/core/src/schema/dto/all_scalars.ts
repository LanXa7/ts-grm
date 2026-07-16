import { AtLeastOne } from "@/dsl";
import { AnyModel } from "../model";
import { EmbeddedPropContract, ScalarPropContract } from "../prop_contract";
import { DtoKind } from "./dto_context";
import { WithNullity } from "./utils";

export type AllScalarsContext<
    TModel extends AnyModel,
    TDtoKind extends DtoKind,
    TMembers
> = {
    $allScalars: AllScalarsMapping<TModel, TDtoKind, TMembers, never>;
}

export interface AllScalarsMapping<
    TModel extends AnyModel,
    TDtoKind extends DtoKind,
    TMembers, 
    TExcludedKeys extends keyof TMembers
> {
    readonly __mappingType: 'ALL_SCALARS';
    readonly __model?: TModel;
    readonly __members?: TMembers;
    readonly __excludedKeys?: TExcludedKeys;

    exclude<const TExcludedKeys extends AtLeastOne<ScalarKeys<TMembers>>>(
        ...keys: TExcludedKeys
    ): AllScalarsMapping<
        TModel,
        TDtoKind,
        TMembers,
        TExcludedKeys[number]
    >;
}

type ScalarKeys<TMembers> = 
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
    TMapping extends AllScalarsMapping<any, infer DtoKind, infer Members, infer ExcludedKeys>
        ? { 
            [
                K in ScalarKeys<Members> as 
                    K extends ExcludedKeys
                        ? never
                        : K
            ]: 
            MemberType<Members[K], DtoKind> 
        }
        : never;

export type MemberType<
    TMember, 
    TDtoKind extends DtoKind
> =
    TMember extends ScalarPropContract<infer R, infer Nullity>
        ? WithNullity<R, Nullity, TDtoKind>
    : TMember extends EmbeddedPropContract<infer NestedProps, infer Nullity, any>
        ? WithNullity<
            DefaultEmbeddedType<NestedProps, TDtoKind>,
            Nullity,
            TDtoKind
        >
    : never;
    
type DefaultEmbeddedType<
    TProps,
    TDtoKind extends DtoKind
> = {
    [K in keyof TProps]: MemberType<TProps[K], TDtoKind>;
};
    
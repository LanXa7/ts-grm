import { AnyModel } from "../model";
import { ScalarLikePropContract } from "../prop_contract";
import { DtoKind } from "./common";
import { WithNullity } from "./utils";

export interface ScalarLikeMapping<
    TModel extends AnyModel, 
    TDtoKind extends DtoKind,
    TKey extends string, 
    TMember
> {

    readonly __mappingType: "SCALAR_LIKE";
    readonly __key?: TKey;
    
    as<TAlias extends string>(
        alias: TAlias
    ): ScalarLikeMapping<TModel, TDtoKind, TAlias, TMember>
}

export type ScalarLikeDtoType<TMapping> =
    TMapping extends ScalarLikeMapping<any, infer DtoKind, infer Key, infer Member>
        ? {
            [K in Key]: DataTypeOf<Member, DtoKind>;
        }
        : never;

type DataTypeOf<TMember, TDtoKind extends DtoKind> =
    TMember extends ScalarLikePropContract<infer R, infer Nullity>
        ? WithNullity<R, Nullity, TDtoKind>
        : never;
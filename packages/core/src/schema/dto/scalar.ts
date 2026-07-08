import { AnyModel } from "../model";
import { ScalarPropContract } from "../prop_contract";
import { DtoKind } from "./common";
import { WithNullity } from "./utils";

export interface ScalarMapping<
    TModel extends AnyModel, 
    TDtoKind extends DtoKind,
    TKey extends string, 
    TMember
> {

    readonly __mappingType: "SCALAR";
    readonly __key?: TKey;
    
    as<TAlias extends string>(
        alias: TAlias
    ): ScalarMapping<TModel, TDtoKind, TAlias, TMember>
}

export type ScalarDtoType<TMapping> =
    TMapping extends ScalarMapping<any, infer DtoKind, infer Key, infer Member>
        ? {
            [K in Key]: DataTypeOf<Member, DtoKind>;
        }
        : never;

type DataTypeOf<TMember, TDtoKind extends DtoKind> =
    TMember extends ScalarPropContract<infer R, infer Nullity>
        ? WithNullity<R, Nullity, TDtoKind>
        : never;
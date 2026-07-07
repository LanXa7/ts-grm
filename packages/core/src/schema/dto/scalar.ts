import { AnyModel } from "../model";
import { ScalarPropContract } from "../prop_contract";
import { NullityMode } from "./common";
import { WithNullity } from "./utils";

export type ScalarContext<
    TModel extends AnyModel,
    TMembers
> = {
    [
        K in keyof TMembers as 
            TMembers[K] extends ScalarPropContract<any, any>
                ? K
                : never
    ]: ScalarMapping1<TModel, K & string, TMembers[K]>;
}

export interface ScalarMapping<
    TModel extends AnyModel, 
    TKey extends string, 
    TMember
> {

    readonly __mappingType: "SCALAR";
    readonly __model?: TModel;
    readonly __key?: TKey;
    readonly __member?: TMember;
}

export interface ScalarMapping1<
    TModel extends AnyModel, 
    TKey extends string, 
    TMember
> extends ScalarMapping<
    TModel,
    TKey,
    TMember
> {
    as<TAlias extends string>(
        alias: TAlias
    ): ScalarMapping<TModel, TAlias, TMember>
}

export type ScalarDtoType<TMapping, TNullityMode extends NullityMode> =
    TMapping extends ScalarMapping<any, infer Key, infer Member>
        ? {
            [K in Key]: DataTypeOf<Member, TNullityMode>;
        }
        : never;

type DataTypeOf<TMember, TNullityMode extends NullityMode> =
    TMember extends ScalarPropContract<infer R, infer Nullity>
        ? WithNullity<R, Nullity, TNullityMode>
        : never;
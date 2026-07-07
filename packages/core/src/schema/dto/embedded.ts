import { AnyModel } from "../model";
import { EmbeddedPropContract } from "../prop_contract";
import { DtoBody, DtoType, NullityMode } from "./common";
import { DefaultTargetMappings, TargetMappings, TargetMembersOf, TargetModelOf } from "./utils";

export type EmbeddedContext<
    TModel extends AnyModel,
    TMembers,
> = {
    [
        K in keyof TMembers as 
            TMembers[K] extends EmbeddedPropContract<any, any, any>
                ? K
                : never
    ]: EmbeddedMapping<TModel, K & string, TMembers[K], DefaultTargetMappings<TModel, TMembers[K]>>;
}

export interface EmbeddedMapping<
    TModel extends AnyModel,
    TKey extends string,
    TMember,
    TMappings extends TargetMappings<TModel, TMember>
> {

    readonly __mappingType: "EMBEDDED";

    as<TAlias extends string>(
        alias: TAlias
    ): EmbeddedMapping<TModel, TAlias, TMember, TMappings>;

    with<const TMappings extends TargetMappings<TModel, TMember>>(
        body: DtoBody<TargetModelOf<TModel, TMember>, TargetMembersOf<TMember>, "EMBEDDABLE", TMappings>
    ): EmbeddedMapping<TModel, TKey, TMember, TMappings>;
}

export type EmbeddedDtoType<TMapping, TNullityMode extends NullityMode> =
    TMapping extends EmbeddedMapping<any, infer Key, any, infer Mappings>
        ? {
            [K in Key]: 
                DtoType<Mappings, TNullityMode>
        }
        : object;
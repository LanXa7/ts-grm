import { AnyModel } from "../model";
import { DtoBody, DtoType, DtoKind } from "./common";
import { TargetMappings, TargetMembersOf, TargetModelOf } from "./utils";

export interface EmbeddedMapping<
    TModel extends AnyModel,
    TDtoKind extends DtoKind,
    TKey extends string,
    TMember,
    TMappings extends TargetMappings<TModel, TMember>
> {

    readonly __mappingType: "EMBEDDED";

    as<TAlias extends string>(
        alias: TAlias
    ): EmbeddedMapping<TModel, TDtoKind, TAlias, TMember, TMappings>;

    with<const TMappings extends TargetMappings<TModel, TMember>>(
        body: DtoBody<TargetModelOf<TModel, TMember>, TDtoKind, "EMBEDDABLE", TargetMembersOf<TMember>, TMappings>
    ): EmbeddedMapping<TModel, TDtoKind, TKey, TMember, TMappings>;
}

export type EmbeddedDtoType<TMapping> =
    TMapping extends EmbeddedMapping<any, any, infer Key, any, infer Mappings>
        ? {
            [K in Key]: 
                DtoType<Mappings>
        }
        : object;
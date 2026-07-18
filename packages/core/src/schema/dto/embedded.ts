import { AnyModel } from "../model";
import { __DtoBody, __DtoType, __DtoKind } from "./dto_context";
import { __TargetMappings, __TargetMembersOf, __PropModelOf } from "./utils";

export interface __EmbeddedMapping<
    TModel extends AnyModel,
    TDtoKind extends __DtoKind,
    TKey extends string,
    TMember,
    TMappings extends __TargetMappings<TModel, TMember>
> {

    readonly __mappingType: "EMBEDDED";

    as<TAlias extends string>(
        alias: TAlias
    ): __EmbeddedMapping<TModel, TDtoKind, TAlias, TMember, TMappings>;

    with<const TMappings extends __TargetMappings<TModel, TMember>>(
        body: __DtoBody<__PropModelOf<TModel, TMember>, TDtoKind, "EMBEDDABLE", __TargetMembersOf<TMember>, TMappings>
    ): __EmbeddedMapping<TModel, TDtoKind, TKey, TMember, TMappings>;
}

export type __EmbeddedDtoType<TMapping> =
    TMapping extends __EmbeddedMapping<any, any, infer Key, any, infer Mappings>
        ? {
            [K in Key]: 
                __DtoType<Mappings>
        }
        : object;
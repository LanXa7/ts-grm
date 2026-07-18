import { EntityTable } from "@/dsl/table";
import { Predicate } from "@/dsl/expression";
import { AnyModel } from "../model";
import { __DtoBody, __DtoType, __DtoKind } from "./dto_context";
import { ModelOrder } from "../order";
import { __TargetMappings, __TargetMembersOf, __PropModelOf } from "./utils";

export interface __CollectionMapping<
    TModel extends AnyModel,
    TDtoKind extends __DtoKind,
    TKey extends string,
    TMember,
    TMappings extends __TargetMappings<TModel, TMember>
> {

    readonly __mappingType: "COLLECTION";
    
    as<TAlias extends string>(
        alias: TAlias
    ): __CollectionMapping<TModel, TDtoKind, TAlias, TMember, TMappings>;

    with<const TMappings extends __TargetMappings<TModel, TMember>>(
        body: __DtoBody<__PropModelOf<TModel, TMember>, TDtoKind, "ENTITY", __TargetMembersOf<TMember>, TMappings>
    ): __CollectionMapping<TModel, TDtoKind, TKey, TMember, TMappings>;

    filter(
        filter: (table: EntityTable<__PropModelOf<TModel, TMember>>) => Predicate | undefined
    ): __CollectionMapping<TModel, TDtoKind, TKey, TMember, TMappings>;

    sort(
        ...orders: ReadonlyArray<ModelOrder<__PropModelOf<TModel, TMember>>>
    ): __CollectionMapping<TModel, TDtoKind, TKey, TMember, TMappings>;

    limit(
        maxRows: number
    ): __CollectionMapping<TModel, TDtoKind, TKey, TMember, TMappings>;
}

export type __CollectionDtoType<TMapping> =
    TMapping extends __CollectionMapping<any, any, infer Key, any, infer Mappings>
        ? {
            [K in Key]: Array<
                __DtoType<Mappings>
            >
        }
        : never
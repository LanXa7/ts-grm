import { EntityTable } from "@/dsl/table";
import { Predicate } from "@/dsl/expression";
import { AnyModel } from "../model";
import { DtoBody, DtoType, DtoKind } from "./dto_context";
import { ModelOrder } from "../order";
import { TargetMappings, TargetMembersOf, PropModelOf } from "./utils";

export interface CollectionMapping<
    TModel extends AnyModel,
    TDtoKind extends DtoKind,
    TKey extends string,
    TMember,
    TMappings extends TargetMappings<TModel, TMember>
> {

    readonly __mappingType: "COLLECTION";
    
    as<TAlias extends string>(
        alias: TAlias
    ): CollectionMapping<TModel, TDtoKind, TAlias, TMember, TMappings>;

    with<const TMappings extends TargetMappings<TModel, TMember>>(
        body: DtoBody<PropModelOf<TModel, TMember>, TDtoKind, "ENTITY", TargetMembersOf<TMember>, TMappings>
    ): CollectionMapping<TModel, TDtoKind, TKey, TMember, TMappings>;

    filter(
        filter: (table: EntityTable<PropModelOf<TModel, TMember>>) => Predicate | undefined
    ): CollectionMapping<TModel, TDtoKind, TKey, TMember, TMappings>;

    sort(
        ...orders: ReadonlyArray<ModelOrder<PropModelOf<TModel, TMember>>>
    ): CollectionMapping<TModel, TDtoKind, TKey, TMember, TMappings>;

    limit(
        maxRows: number
    ): CollectionMapping<TModel, TDtoKind, TKey, TMember, TMappings>;
}

export type CollectionDtoType<TMapping> =
    TMapping extends CollectionMapping<any, any, infer Key, any, infer Mappings>
        ? {
            [K in Key]: Array<
                DtoType<Mappings>
            >
        }
        : never
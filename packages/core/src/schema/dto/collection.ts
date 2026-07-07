import { AtLeastOne, EntityTable, Predicate } from "@/dsl";
import { AnyModel } from "../model";
import { CollectionPropContract } from "../prop_contract";
import { DtoBody, DtoType, NullityMode } from "./common";
import { ModelOrder } from "../order";
import { DefaultTargetMappings, TargetMappings, TargetMembersOf, TargetModelOf } from "./utils";

export type CollectionContext<
    TModel extends AnyModel,
    TMembers,
> = {
    [
        K in keyof TMembers as 
            TMembers[K] extends CollectionPropContract<any, any, any, any, any>
                ? K
                : never
    ]: CollectionMapping<
        TModel, 
        K & string, 
        TMembers[K],
        DefaultTargetMappings<TModel, TMembers[K]>
    >;
}

export interface CollectionMapping<
    TModel extends AnyModel,
    TKey extends string,
    TMember,
    TMappings extends TargetMappings<TModel, TMember>
> {

    readonly __mappingType: "COLLECTION";
    
    as<TAlias extends string>(
        alias: TAlias
    ): CollectionMapping<TModel, TAlias, TMember, TMappings>;

    with<const TMappings extends TargetMappings<TModel, TMember>>(
        body: DtoBody<TargetModelOf<TModel, TMember>, TargetMembersOf<TMember>, "EMBEDDABLE", TMappings>
    ): CollectionMapping<TModel, TKey, TMember, TMappings>;

    where(
        filter: (table: EntityTable<TargetModelOf<TModel, TMember>>) => Predicate | undefined
    ): CollectionMapping<TModel, TKey, TMember, TMappings>;

    orderBy(
        ...orders: AtLeastOne<ModelOrder<TargetModelOf<TModel, TMember>>>
    ): CollectionMapping<TModel, TKey, TMember, TMappings>;

    limit(maxRows: number): CollectionMapping<TModel, TKey, TMember, TMappings>;
}

export type CollectionDtoType<
    TMapping, 
    TNullityMode extends NullityMode
> =
    TMapping extends CollectionMapping<any, infer Key, any, infer Mappings>
        ? {
            [K in Key]: Array<
                DtoType<Mappings, TNullityMode>
            >
        }
        : never
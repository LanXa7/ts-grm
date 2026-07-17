import { EntityTable } from "@/dsl/table";
import { Predicate } from "@/dsl/expression";
import { AnyModel } from "../model";
import { NullityType } from "../prop_internal_types";
import { DtoBody, DtoType, DtoKind} from "./dto_context";
import { TargetMappings, TargetMembersOf, PropModelOf, WithNullity } from "./utils";
import { ReferenceFetchType } from "./api";

export interface ReferenceMapping<
    TModel extends AnyModel,
    TDtoKind extends DtoKind,
    TKey extends string,
    TMember,
    TMappings extends TargetMappings<TModel, TMember>,
    TNullity extends NullityType
> {

    readonly __mappingType: "REFERENCE";
    
    as<TAlias extends string>(
        alias: TAlias
    ): ReferenceMapping<TModel, TDtoKind, TAlias, TMember, TMappings, TNullity>;

    with<const TMappings extends TargetMappings<TModel, TMember>>(
        body: DtoBody<PropModelOf<TModel, TMember>, TDtoKind, "ENTITY", TargetMembersOf<TMember>, TMappings>
    ): ReferenceMapping<TModel, TDtoKind, TKey, TMember, TMappings, TNullity>;

    filter(
        filter: (table: EntityTable<PropModelOf<TModel, TMember>>) => Predicate | undefined
    ): ReferenceMapping<TModel, TDtoKind, TKey, TMember, TMappings, "NULLABLE">;

    fetch(
        fetchType: ReferenceFetchType
    ): ReferenceMapping<TModel, TDtoKind, TKey, TMember, TMappings, TNullity>;
}

export type ReferenceDtoType<TMapping> =
    TMapping extends ReferenceMapping<any, infer DtoKind, infer Key, any, infer Mappings, infer Nullity>
        ? { 
            [K in Key]: 
                WithNullity<
                    DtoType<Mappings>,
                    Nullity,
                    DtoKind
                >
        }
        : never;
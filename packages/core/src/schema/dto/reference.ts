import { EntityTable, Predicate } from "@/dsl";
import { AnyModel } from "../model";
import { NullityType } from "../prop_contract";
import { DtoBody, DtoType, DtoKind} from "./dto_context";
import { TargetMappings, TargetMembersOf, TargetModelOf, WithNullity } from "./utils";
import { ReferenceFetchType } from "./reference_fetch_type";

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
        body: DtoBody<TargetModelOf<TModel, TMember>, TDtoKind, "ENTITY", TargetMembersOf<TMember>, TMappings>
    ): ReferenceMapping<TModel, TDtoKind, TKey, TMember, TMappings, TNullity>;

    where(
        filter: (table: EntityTable<TargetModelOf<TModel, TMember>>) => Predicate | undefined
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
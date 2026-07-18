import { EntityTable } from "@/dsl/table";
import { Predicate } from "@/dsl/expression";
import { AnyModel } from "../model";
import { __NullityType } from "../prop_internal_types";
import { __DtoBody, __DtoType, __DtoKind} from "./dto_context";
import { __TargetMappings, __TargetMembersOf, __PropModelOf, __WithNullity } from "./utils";
import { ReferenceFetchType } from "./api";

export interface __ReferenceMapping<
    TModel extends AnyModel,
    TDtoKind extends __DtoKind,
    TKey extends string,
    TMember,
    TMappings extends __TargetMappings<TModel, TMember>,
    TNullity extends __NullityType
> {

    readonly __mappingType: "REFERENCE";
    
    as<TAlias extends string>(
        alias: TAlias
    ): __ReferenceMapping<TModel, TDtoKind, TAlias, TMember, TMappings, TNullity>;

    with<const TMappings extends __TargetMappings<TModel, TMember>>(
        body: __DtoBody<__PropModelOf<TModel, TMember>, TDtoKind, "ENTITY", __TargetMembersOf<TMember>, TMappings>
    ): __ReferenceMapping<TModel, TDtoKind, TKey, TMember, TMappings, TNullity>;

    filter(
        filter: (table: EntityTable<__PropModelOf<TModel, TMember>>) => Predicate | undefined
    ): __ReferenceMapping<TModel, TDtoKind, TKey, TMember, TMappings, "NULLABLE">;

    fetch(
        fetchType: ReferenceFetchType
    ): __ReferenceMapping<TModel, TDtoKind, TKey, TMember, TMappings, TNullity>;
}

export type __ReferenceDtoType<TMapping> =
    TMapping extends __ReferenceMapping<any, infer DtoKind, infer Key, any, infer Mappings, infer Nullity>
        ? { 
            [K in Key]: 
                __WithNullity<
                    __DtoType<Mappings>,
                    Nullity,
                    DtoKind
                >
        }
        : never;
import { EntityTable, Predicate } from "@/dsl";
import { AnyModel } from "../model";
import { NullityType, ReferencePropContract } from "../prop_contract";
import { DtoBody, DtoType, NullityMode} from "./common";
import { DefaultTargetMappings, NullityOf, TargetMappings, TargetMembersOf, TargetModelOf, WithNullity } from "./utils";

export type ReferenceContext<
    TModel extends AnyModel,
    TMembers,
> = {
    [
        K in keyof TMembers as 
            TMembers[K] extends ReferencePropContract<any, any, any, any, any, any>
                ? K
                : never
    ]: ReferenceMapping<
        TModel, 
        K & string, 
        TMembers[K],
        DefaultTargetMappings<TModel, TMembers[K]>,
        NullityOf<TMembers[K]>
    >;
}

export interface ReferenceMapping<
    TModel extends AnyModel,
    TKey extends string,
    TMember,
    TMappings extends TargetMappings<TModel, TMember>,
    TNullity extends NullityType
> {

    readonly __mappingType: "REFERENCE";
    
    as<TAlias extends string>(
        alias: TAlias
    ): ReferenceMapping<TModel, TAlias, TMember, TMappings, TNullity>;

    with<const TMappings extends TargetMappings<TModel, TMember>>(
        body: DtoBody<TargetModelOf<TModel, TMember>, TargetMembersOf<TMember>, "EMBEDDABLE", TMappings>
    ): ReferenceMapping<TModel, TKey, TMember, TMappings, TNullity>;

    where(
        filter: (table: EntityTable<TargetModelOf<TModel, TMember>>) => Predicate | undefined
    ): ReferenceMapping<TModel, TKey, TMember, TMappings, "NULLABLE">;
}

export type ReferenceDtoType<
    TMapping, 
    TNullityMode extends NullityMode
> =
    TMapping extends ReferenceMapping<any, infer Key, infer Member, infer Mappings, infer Nullity>
        ? { 
            [K in Key]: 
                WithNullity<
                    DtoType<Mappings, TNullityMode>,
                    Nullity,
                    TNullityMode
                >
        }
        : never;
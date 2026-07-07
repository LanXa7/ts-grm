import { AnyModel, RequiredModelKey } from "../model";
import { ReferencePropContract } from "../prop_contract";

export type ReferenceKeyContext<
    TModel extends AnyModel,
    TMembers
> = {
    [
        K in keyof TMembers as 
            TMembers[K] extends ReferencePropContract<infer TargetModel, any, any, any, any, infer TargetKey>
                ? `${K & string}${Capitalize<RequiredModelKey<TargetModel, TargetKey>>}`
                : never
    ]: ReferenceKeyMapping<TModel, K & string, TMembers[K]>
}

export interface ReferenceKeyMapping<
    TModel extends AnyModel, 
    TKey extends string, 
    TMember
> {

    readonly __mappingType: "REFERENCE_KEY";
    
    readonly __key?: TKey;
    
    as<TAlias extends string>(
        alias: TAlias
    ): ReferenceKeyMapping<TModel, TAlias, TMember>;
}

import { ViewArgs } from ".";
import { ViewNullType } from "../dto";
import { AllModelMembers, AnyModel } from "../model";
import { ParameterizedCalculatedCollectionPropContract, ParameterizedCalculatedReferencePropContract } from "../prop_contract";
import { TypeWithNullity, With } from "./common";
import { UnionToIntersection } from "@/utils";
import { MakeReferenceDataType } from "./reference";
import { MakeCollectionDataType } from "./collection";

export type ParameterizedCalculatedValueArgs<TParameter> =
    { 
        readonly alias?: string;
        readonly parameter: TParameter;
    };

export type CalcuatedAssociationArgs<TModel extends AnyModel> =
    true
    | With<TModel, AllModelMembers<TModel>, ViewArgs<TModel>> 
    | {
        readonly alias?: string;
        readonly with?: With<TModel, AllModelMembers<TModel>, ViewArgs<TModel>>;
    };

export type ParameterizedCalcuatedAssociationArgs<TParameter, TModel extends AnyModel> =
    AliasOptionalArgs<TParameter, TModel> 
    | ReadonlyArray<AliasRequiredArgs<TParameter, TModel>>;

interface AliasOptionalArgs<TParameter, TModel extends AnyModel> {
    readonly alias?: string;
    readonly parameter: TParameter;
    readonly with?: With<TModel, AllModelMembers<TModel>, ViewArgs<TModel>>;
}

interface AliasRequiredArgs<TParameter, TModel extends AnyModel> {
    readonly alias: string;
    readonly parameter: TParameter;
    readonly with?: With<TModel, AllModelMembers<TModel>, ViewArgs<TModel>>;
}

export type MakeParameterizedCalculatedAssociations<
    TViewArgs,
    TMembers,
    TViewNullType extends ViewNullType
> = 
    UnionToIntersection<
        MakeAssociationTypes<TViewArgs, TMembers, TViewNullType>[
            keyof MakeAssociationTypes<TViewArgs, TMembers, TViewNullType>
        ]
    >;

type MakeAssociationTypes<
    TViewArgs,
    TMembers,
    TViewNullType extends ViewNullType
> = {
    [
        K in keyof TViewArgs as 
            TViewArgs[K] extends ReadonlyArray<any>
                ? K
                : never
    ]: TViewArgs[K] extends ReadonlyArray<any>
        ? MakeAssociations<
            TViewArgs[K], 
            TMembers[K & keyof TMembers],
            TViewNullType
        >
        : never
};

type MakeAssociations<
    TArgsArr extends ReadonlyArray<{alias: string}>,
    TMember,
    TViewNullType extends ViewNullType
> = {
    [E in TArgsArr[number] as E["alias"]]: 
        TMember extends ParameterizedCalculatedCollectionPropContract<any, infer TargetModel>
            ? MakeCollectionDataType<E, TargetModel, TViewNullType>
        : TMember extends ParameterizedCalculatedReferencePropContract<any, infer TargetModel, infer Nullity>
            ? TypeWithNullity<
                MakeReferenceDataType<E, TargetModel, TViewNullType>,
                Nullity,
                TViewNullType
            >
        :never;
};

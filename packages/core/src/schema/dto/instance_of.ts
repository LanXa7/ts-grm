import { UnionToIntersection } from "@/utils";
import { AnyModel, DeclaredModelMembers, DerivedModel, ModelName, ModelSuperNames } from "../model";
import { DtoBody, DtoKind, DtoMapping, DtoType } from "./common";
import { SelfMappings } from "./utils";

export interface InstanceOfContext<
    TModel extends AnyModel,
    TDtoKind extends DtoKind
> {
    $instanceOf<
        TDerivedModel extends AnyModel, 
        const TMappings extends SelfMappings<TDerivedModel>
    >(
        derivedModel: DerivedModel<TDerivedModel, TModel>,
        body: DtoBody<TDerivedModel, TDtoKind, "DERIVED_ENTITY", DeclaredModelMembers<TDerivedModel>, TMappings>
    ): InstanceOfMappping<
        TModel,
        TDtoKind,
        TDerivedModel,
        TMappings
    >;
}

export interface InstanceOfMappping<
    TModel extends AnyModel,
    TDtoKind extends DtoKind,
    TDerivedModel extends AnyModel,
    TMappings extends SelfMappings<TDerivedModel>
> {
    readonly __mappingType: "INSTANCE_OF";
    readonly __model?: TModel;
    readonly __dtoKind?: TDtoKind;
    readonly __derivedModel?: TDerivedModel;
    readonly __mappings: TMappings;
}

export type ApplyInstanceOfMappings<
    TPrevData,
    TMappings extends ReadonlyArray<DtoMapping<any>>,
    THasInstanceOf extends boolean = false
> = 
    TMappings extends readonly [infer First, ...infer Rest extends ReadonlyArray<DtoMapping<any>>]
        ? First extends InstanceOfMappping<infer Model, any, infer DerivedModel, infer DerivedMappings>
            ? DerivedType<TPrevData, DtoType<DerivedMappings>, Model, DerivedModel>
                | ApplyInstanceOfMappings<TPrevData, Rest, true>
            : ApplyInstanceOfMappings<TPrevData, Rest, THasInstanceOf>
        : THasInstanceOf extends true
            ? never
            : TPrevData;

type DerivedType<
    TSuper,
    TDerived,
    TModel extends AnyModel,
    TDerivedModel extends AnyModel
> = 
    ( 
        TDerived extends { __typename: string; }
            ? TDerived
                & SuperFields<
                    TSuper, 
                    ModelSuperNames<TDerivedModel>
                >
            : { __typename: ModelName<TDerivedModel> } 
                & TDerived
                & SuperFields<
                    TSuper, 
                    ModelSuperNames<TDerivedModel>
                >
    ) | (
        TSuper extends { __typename: string; }
            ? TSuper
            : { __typename: ModelName<TModel> } & TSuper
    );

type SuperFields<
    TPrevData,
    TTypeNames extends string
> = [TPrevData] extends [{ __typename: string }]
    ? UnionToIntersection<
        ExtractSuperFields<TPrevData, TTypeNames>
    >
    : TPrevData;

type ExtractSuperFields<
    TPrevData,
    TTypeNames extends string,
> = TTypeNames extends any
    ? ExtractByTypeName<TPrevData, TTypeNames> extends infer ST
        ? ST extends { __typename: string; }
            ? Omit<ST, "__typename">
            : never
        : never
    : never;

type ExtractByTypeName<TUnion, TTypeNames> = 
    TUnion extends { __typename: TTypeNames; } 
        ? TUnion 
        : never;

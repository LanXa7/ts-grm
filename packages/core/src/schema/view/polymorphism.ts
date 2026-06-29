// import { UnionToIntersection } from "@/utils";
// import { ExplicitViewArgs, ViewTypeImpl } from ".";
// import { ViewNullType } from "../dto";
// import { AnyModel, DeclaredModelMembers, DerivedModel, ModelName, ModelSuperNames } from "../model";
// import { ExplicitActionKeys, RestrictKeys } from "./common";

// export type PolymorphismArgs<TModel extends AnyModel> =
//     PolymorphismEntry<any, TModel, any>
//     | PolymorphismEntries<TModel, any>;

// export interface PolymorphismEntry<
//     TDerivedModel extends AnyModel, 
//     TModel extends AnyModel,
//     TArgs extends ExplicitViewArgs<TDerivedModel, DeclaredModelMembers<TDerivedModel>>
// > {
//     readonly derivedModel: TDerivedModel;
//     readonly model: TModel;
//     readonly args: TArgs;
    
//     when<
//         TDerivedModel2 extends AnyModel,
//         const TArgs2 extends ExplicitViewArgs<TDerivedModel2, DeclaredModelMembers<TDerivedModel2>>
//     >(
//         derivedModel: DerivedModel<TDerivedModel2, TModel>,
//         args: RestrictKeys<TArgs2, keyof DeclaredModelMembers<TDerivedModel2> | ExplicitActionKeys>
//     ): PolymorphismEntries<
//         TModel, 
//         [
//             PolymorphismEntry<TDerivedModel, TModel, TArgs>, 
//             PolymorphismEntry<TDerivedModel2, TModel, TArgs2>
//         ]
//     >;
// }

// export type ApplyPolymorphism<T, TViewArgs, TModel extends AnyModel, TViewNullType extends ViewNullType> = 
//     TViewArgs extends { $polymorphism: infer PolymorphismArgs }
//         ? MakePolymorphismType<
//             T,
//             PolymorphismArgs,
//             TModel,
//             TViewNullType
//         >
//         : T;

// type MakePolymorphismType<
//     T, 
//     TPolymorphismArgs, 
//     TModel extends AnyModel, 
//     TViewNullType extends ViewNullType
// > = 
//     TPolymorphismArgs extends PolymorphismEntry<infer DerivedModel, any, infer DerivedArgs>
//         ? DerivedType<
//             T,
//             ViewTypeImpl<DerivedModel, DerivedArgs, DeclaredModelMembers<DerivedModel>, TViewNullType>,
//             DerivedModel,
//             TModel
//         >
//     : TPolymorphismArgs extends PolymorphismEntries<any, infer Array>
//         ? ArrayToPolymorphismUnion<
//             T,
//             Array,
//             TModel,
//             TViewNullType
//         >
//     : never;

// type DerivedType<
//     T,
//     X,
//     TDerivedModel extends AnyModel,
//     TModel extends AnyModel,
// > = ( 
//     [X] extends [{__typename: string}]
//         ? X
//             & SuperFields<
//                 T, 
//                 ModelSuperNames<TDerivedModel>
//             >
//         : { __typename: ModelName<TDerivedModel> } 
//             & X
//             & SuperFields<
//                 T, 
//                 ModelSuperNames<TDerivedModel>
//             >
// ) | (
//     [T] extends [{__typename: string}]
//         ? T
//         : { __typename: ModelName<TModel> } & T
// );

// type SuperFields<
//     TPrevData,
//     TTypeNames extends string
// > = [TPrevData] extends [{ __typename: string }]
//     ? UnionToIntersection<
//         ExtractSuperFields<TPrevData, TTypeNames>
//     >
//     : TPrevData;

// type ExtractSuperFields<
//     TPrevData,
//     TTypeNames extends string,
// > = TTypeNames extends any
//     ? ExtractByTypeName<TPrevData, TTypeNames> extends infer ST
//         ? ST extends { __typename: string }
//             ? Omit<ST, "__typename">
//             : never
//         : never
//     : never;

// type ExtractByTypeName<TUnion, TTypeNames> = 
//     TUnion extends { __typename: TTypeNames } 
//         ? TUnion 
//         : never;

// type ArrayToPolymorphismUnion<
//     T,
//     TArray extends ReadonlyArray<PolymorphismEntry<any, any, any>>,
//     TModel extends AnyModel,
//     TViewNullType extends ViewNullType
// > = 
//     TArray extends readonly [infer First, ...infer Rest]
//         ? First extends PolymorphismEntry<infer DerivedModel, any, infer DerivedArgs>
//             ? DerivedType<
//                 T,
//                 ViewTypeImpl<DerivedModel, DerivedArgs, DeclaredModelMembers<DerivedModel>, TViewNullType>,
//                 DerivedModel,
//                 TModel
//             >
//             | (Rest extends ReadonlyArray<PolymorphismEntry<any, any, any>>
//                 ? ArrayToPolymorphismUnion<T, Rest, TModel, TViewNullType>
//                 : never)
//             : never
//         : never;

// export interface PolymorphismEntries<
//     TModel extends AnyModel, 
//     TEntries extends ReadonlyArray<PolymorphismEntry<any, TModel, any>>
// > {
    
//     readonly entries: TEntries;

//     when<
//         TDerivedModel extends AnyModel,
//         const TArgs extends ExplicitViewArgs<TDerivedModel, DeclaredModelMembers<TDerivedModel>>
//     >(
//         derivedModel: DerivedModel<TDerivedModel, TModel>,
//         args: RestrictKeys<TArgs, keyof DeclaredModelMembers<TDerivedModel> | ExplicitActionKeys>
//     ): PolymorphismEntries<TModel, [...TEntries, PolymorphismEntry<TDerivedModel, TModel, TArgs>]>;
// }
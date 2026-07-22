import { AnyModel } from "@/schema/model";
import { __AllModelMembers, __DeclaredModelMembers, __DerivedModel } from "@/schema/model_internal_types";
import { __CombinedNullity } from "@/schema/prop_internal_behavior";
import { 
    __CollectionPropContract, 
    __NullityType, 
    __ReferencePropContract, 
    __EmbeddedPropContract, 
    __I64PropContract, 
    __PropContract, 
    __ScalarPropContract 
} from "@/schema/prop_internal_types";
import { Criteria } from "./criteria";

export type __CriteriaMembers<
    TOptinalModel extends AnyModel | "",
    TMembers, 
    TNullity extends __NullityType
> = { [K in keyof TMembers]?: __CriteriaMember<TMembers[K], TNullity>; }
& __CriteraStaticMembers<TOptinalModel, TMembers, TNullity>
& __CriteriaInstanceOf<TOptinalModel>;

export interface __CriteraStaticMembers<
    TOptinalModel extends AnyModel | "",
    TMembers, 
    TNullity extends __NullityType
> {
    readonly $and?: __CriteriaMembers<TOptinalModel, TMembers, TNullity> 
    | ReadonlyArray<__CriteriaMembers<TOptinalModel, TMembers, TNullity>>;

    readonly $or?: __CriteriaMembers<TOptinalModel, TMembers, TNullity> | 
    ReadonlyArray<__CriteriaMembers<TOptinalModel, TMembers, TNullity>>;

    readonly $not?: __CriteriaMembers<TOptinalModel, TMembers, TNullity> 
    | ReadonlyArray<__CriteriaMembers<TOptinalModel, TMembers, TNullity>>;
};

export type __CriteriaInstanceOf<TOptinalModel extends AnyModel | ""> =
    TOptinalModel extends AnyModel
        ? {
            readonly $instanceOf?: __CriteriaInstanceOfBinding<TOptinalModel, any>;
        }
        : object;

export interface __CriteriaInstanceOfBinding<
    TSuperMdel extends AnyModel,
    TDrivedModel extends AnyModel
> {
    __sueprModel?: TSuperMdel;
    __derivedModel?: TDrivedModel;
}

export type __CriteriaMember<TProp, TNullity extends __NullityType> =
    TProp extends __PropContract<any, infer Nullity>
        ? Nullity extends "NULLABLE"
            ? { $isNull: boolean } | __NonNullCriteriaMember<TProp, TNullity>
            : __NonNullCriteriaMember<TProp, TNullity>
        : never;

export type __NonNullCriteriaMember<TProp, TNullity extends __NullityType> =
    TProp extends __ScalarPropContract<any, any>
        ? __CriteriaScalarType<TProp>
    : TProp extends __EmbeddedPropContract<infer R, infer Nullity, any>
        ? { [K in keyof R]?: __CriteriaMember<R[K], __CombinedNullity<TNullity, Nullity>> } & __CriteriaMembers<"", R, TNullity>
    : TProp extends __ReferencePropContract<any, any, any, any, any, any>
        ? __CriteriaReferenceType<TProp>
    : TProp extends __CollectionPropContract<any, any, any, any, any>
        ? __CriteriaCollectionType<TProp>
    : never;

export type __CriteriaScalarType<TProp> =
    TProp extends __I64PropContract<any, any>
        ? string | number | __CriteriaCmpJson<string> | __CriteriaCmpJson<number>
    : TProp extends __ScalarPropContract<infer R, any>
        ? R extends string
            ? string | __CriteriaStrJson
        : R extends Date
            ? Date | __CriteriaCmpJson<number>
        : R extends number
            ? number | __CriteriaCmpJson<number>
        : R | __CriteriaAnyJson<R>
    : never;

export type __CriteriaReferenceType<TProp> = 
    __CriteriaTarget<TProp> 
    | { $some: __CriteriaTarget<TProp>; }
    | { $none: __CriteriaTarget<TProp>; }
    | { $exists: boolean } & __CriteriaTarget<TProp>;

export type __CriteriaCollectionType<TProp> =
    __CriteriaTarget<TProp> 
    | { $some: __CriteriaTarget<TProp>; }
    | { $none: __CriteriaTarget<TProp>; }
    | { $all: __CriteriaTarget<TProp> }
    | { $exists: boolean } & __CriteriaTarget<TProp>
    | { $size: number | __CriteriaCmpJson<number> } & __CriteriaTarget<TProp>;

export type __CriteriaTarget<TProp> =
    TProp extends __CollectionPropContract<infer TargetModel, any, any, any, any>
        ? Criteria<TargetModel>
        : never;

export interface __CriteriaAnyJson<T> {
    $eq?: T;
    $ne?: T;
    $eqIf?: T | null | undefined;
    $neIf?: T | null | undefined;
}

export interface __CriteriaCmpJson<T> extends __CriteriaAnyJson<T> {
    $lt?: T;
    $lte?: T;
    $gt?: T;
    $gte?: T;
    $between?: [T, T];
    $in?: T[];
    $nin?: T[];
    $ltIf?: T | null | undefined;
    $lteIf?: T | null | undefined;
    $gtIf?: T | null | undefined;
    $gteIf?: T | null | undefined;
    $betweenIf?: [T | null | undefined, T | null | undefined];
    $inIf?: T[] | null | undefined;
    $ninIf?: T[] | null | undefined;
}

export interface __CriteriaStrJson extends __CriteriaCmpJson<string> {
    $startsWith?: string;
    $endsWith?: string;
    $contains?: string;
    $regex?: string | RegExp;
    $istartsWith?: string;
    $iendsWith?: string;
    $icontains?: string;
    $iregex?: string | RegExp;
    $startsWithIf?: string | null | undefined;
    $endsWithIf?: string | null | undefined;
    $containsIf?: string | null | undefined;
    $regexIf?: string | RegExp;
    $istartsWithIf?: string | null | undefined;
    $iendsWithIf?: string | null | undefined;
    $icontainsIf?: string | null | undefined;
    $iregexIf?: string | RegExp;
}

export interface __CriteriaHelper {
    instanceOf<
        TSuperMdel extends AnyModel,
        TDrivedModel extends AnyModel,
    >(
        model: TSuperMdel,
        derivedModel: __DerivedModel<TDrivedModel, TSuperMdel>,
        criteria: __CriteriaMembers<TDrivedModel, __DeclaredModelMembers<TDrivedModel>, "NONNULL">
    ): __CriteriaInstanceOfBinding<TSuperMdel, TDrivedModel>;
}

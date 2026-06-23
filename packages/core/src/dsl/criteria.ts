import { AllModelMembers, AnyModel } from "@/schema/model";
import { CombinedNullity } from "@/schema/prop";
import { CollectionPropContract, NullityType, ReferencePropContract, EmbeddedPropContract, I64PropContract, PropContract, ScalarPropContract } from "@/schema/prop_contract";

export type Criteria<TModel extends AnyModel> =
    CriteriaMembers<AllModelMembers<TModel>, "NONNULL">;

type CriteriaMembers<TMembers, TNullity extends NullityType> = {
    [K in keyof TMembers]?: CriteriaMember<TMembers[K], TNullity>;
} & LogicOperators<TMembers, TNullity>;

type LogicOperators<TMembers, TNullity extends NullityType> = {
    $and?: CriteriaMembers<TMembers, TNullity> | CriteriaMembers<TMembers, TNullity>[];
    $or?: CriteriaMembers<TMembers, TNullity> | CriteriaMembers<TMembers, TNullity>[];
    $not?: CriteriaMembers<TMembers, TNullity> | CriteriaMembers<TMembers, TNullity>[];
};

type CriteriaMember<TProp, TNullity extends NullityType> =
    TProp extends PropContract<any, infer Nullity>
        ? Nullity extends "NULLABLE"
            ? { $isNull: boolean } | NonNullCriteriaMember<TProp, TNullity>
            : NonNullCriteriaMember<TProp, TNullity>
        : never;

type NonNullCriteriaMember<TProp, TNullity extends NullityType> =
    TProp extends ScalarPropContract<any, any>
        ? ScalarType<TProp>
    : TProp extends EmbeddedPropContract<infer R, infer Nullity, any>
        ? { [K in keyof R]?: CriteriaMember<R[K], CombinedNullity<TNullity, Nullity>> } & LogicOperators<R, TNullity>
    : TProp extends ReferencePropContract<any, any, any, any, any, any>
        ? ReferenceType<TProp>
    : TProp extends CollectionPropContract<any, any, any, any, any, any>
        ? CollectionType<TProp>
    : never;

type ScalarType<TProp> =
    TProp extends I64PropContract<any, any>
        ? string | CmpJson<string>
    : TProp extends ScalarPropContract<infer R, any>
        ? R extends string
            ? string | StrJson
        : R extends Date
            ? Date | CmpJson<number>
        : R extends number
            ? number | CmpJson<number>
        : R | AnyJson<R>
    : never;

type ReferenceType<TProp> = 
    { $action?: "SOME" | "NONE"; }
    & (
        TProp extends ReferencePropContract<infer TargetModel, any, any, any, any, any>
            ? CriteriaMembers<AllModelMembers<TargetModel>, "NONNULL">
            : never
    );

type CollectionType<TProp> =
    ElementMembers<TProp> 
    | { $some: ElementMembers<TProp>; }
    | { $none: ElementMembers<TProp>; }
    | { $all: ElementMembers<TProp> }
    | { $exists: boolean } & ElementMembers<TProp>
    | { $size: number | CmpJson<number> } & ElementMembers<TProp>;

type ElementMembers<TProp> =
    TProp extends CollectionPropContract<infer TargetModel, any, any, any, any, any>
        ? CriteriaMembers<AllModelMembers<TargetModel>, "NONNULL">
        : never;

interface AnyJson<T> {
    $eq?: T;
    $ne?: T;
    $eqIf?: T | null | undefined;
    $neIf?: T | null | undefined;
}

interface CmpJson<T> extends AnyJson<T> {
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

interface StrJson extends CmpJson<string> {
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

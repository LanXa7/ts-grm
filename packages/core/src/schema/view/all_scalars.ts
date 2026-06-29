import { ViewNullType } from "../dto";
import { EmbeddedPropContract, ScalarPropContract } from "../prop_contract";
import { TypeWithNullity } from "./common";

export type AllScalarsArgs<TMembers> = 
    true | Partial<AllScalarsArgsImpl<TMembers>>;

type AllScalarsArgsImpl<
    TMembers
> = 
    { readonly exclude: RemoveableKeys<TMembers> | ReadonlyArray<RemoveableKeys<TMembers>>; };

export type RemoveableKeys<TMembers> = 
    keyof {
        [K in keyof TMembers as 
            TMembers[K] extends ScalarPropContract<any, any>
                ? K
            : TMembers[K] extends EmbeddedPropContract<any, any, any>
                ? K
            : never
        ]: never
    };

export type AllScalarsViewTypeRef<TViewArgs, TMembers, TViewNullType extends ViewNullType> =
    TViewArgs extends { $explicit: any }
        ? object
    : TViewArgs extends { $allScalars: infer AllScalarArgs }
        ? AllScalarsViewType<AllScalarArgs, TMembers, TViewNullType>
    : object;

export type AllScalarsViewType<TAllScalarsArgs, TMembers, TViewNullType extends ViewNullType> =
    TAllScalarsArgs extends { exclude: infer ExcludedProp extends RemoveableKeys<TMembers> }
        ? Omit<DefaultAllScalarsViewType<TMembers, TViewNullType>, ExcludedProp>
    : TAllScalarsArgs extends { exclude: infer ExcludedProps extends ReadonlyArray<RemoveableKeys<TMembers>> }
        ? Omit<DefaultAllScalarsViewType<TMembers, TViewNullType>, ExcludedProps[number]>
    : DefaultAllScalarsViewType<TMembers, TViewNullType>;

type DefaultAllScalarsViewType<TMembers, TViewNullType extends ViewNullType> = {
    [
        K in keyof TMembers as 
            TMembers[K] extends ScalarPropContract<any, any> 
                ? K
            : TMembers[K] extends EmbeddedPropContract<any, any, any> 
                ? K
                : never
    ]: MemberType<TMembers[K], TViewNullType>
};

type MemberType<TProp, TViewNullType extends ViewNullType> =
    TProp extends ScalarPropContract<infer R, infer Nullity>
        ? TypeWithNullity<R, Nullity, TViewNullType>
    : TProp extends EmbeddedPropContract<infer NestedProps, infer Nullity, any>
        ? TypeWithNullity<
            DefaultAllScalarsViewType<NestedProps, TViewNullType>,
            Nullity,
            TViewNullType
        >
    : never;

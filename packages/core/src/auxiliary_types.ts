import { __FollowNullity, __FollowPrefix } from "./schema/prop_internal_behavior";
import { __EmbeddedPropContract } from "./schema/prop_internal_types";

export type __Prettify<T> = 
    T extends Array<infer U>
        ? __Prettify<U>[]
    : T extends object
        ? { 
            -readonly [K in keyof T]: __Prettify<T[K]> 
        }
    : T;

export type __FlattenMembers<
    TMembers extends object
> = {
    [K in keyof TMembers
        as TMembers[K] extends __EmbeddedPropContract<any, any, any>
            ? never
            : K
    ]: TMembers[K]
} & __UnionToIntersection<
    __FlattenUnion<{
        [K in keyof TMembers
            as TMembers[K] extends __EmbeddedPropContract<any, any, any>
                ? K
                : never
        ]: 
            TMembers[K] extends __EmbeddedPropContract<any, infer Nullity, infer FlattenProps>
                ? {
                    [DK in keyof FlattenProps as 
                        __FollowPrefix<DK & string, K & string>
                    ]: __FollowNullity<FlattenProps[DK], Nullity>
                }
                : never
    }>
>;

type __FlattenUnion<T> =
    T[keyof T];

export type __UnionToIntersection<U> = 
    (U extends any ? (k: U) => void : never) extends (k: infer I) => void 
        ? I 
        : never;

export type __CompilationError<T extends string> =
    `\u274C ts-grm: ${T}`;

export type __Mutable<T> = 
    T extends object
        ? { -readonly [P in keyof T]: __Mutable<T[P]> }
        : T;

export function suppressUnused(_x: any) {}

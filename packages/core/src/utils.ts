import { EmbeddedProp, FollowNullity, FollowPrefix } from "./schema/prop";

export type Prettify<T> = 
    T extends Array<infer U>
        ? Prettify<U>[]
    : T extends object
        ? { 
            [K in keyof T]: Prettify<T[K]> 
        }
    : T;

export type FilterNever<T> = 
    T extends object
        ? {
            [K in keyof T as T[K] extends never ? never : K]: T[K]
        }
        : never;

export type FlattenMembers<
    TMembers extends object
> = {
    [K in keyof TMembers
        as TMembers[K] extends EmbeddedProp<any, any, any>
            ? never
            : K
    ]: TMembers[K]
} & UnionToIntersection<
    FlattenUnion<{
        [K in keyof TMembers
            as TMembers[K] extends EmbeddedProp<any, any, any>
                ? K
                : never
        ]: 
            TMembers[K] extends EmbeddedProp<any, infer Nullity, infer FlattenProps>
                ? {
                    [DK in keyof FlattenProps as 
                        FollowPrefix<DK & string, K & string>
                    ]: FollowNullity<FlattenProps[DK], Nullity>
                }
                : never
    }>
>;

type FlattenUnion<T> =
    T[keyof T];

export type UnionToIntersection<U> = 
    (U extends any ? (k: U) => void : never) extends (k: infer I) => void 
        ? I 
        : never;

export type CompilationError<T extends string> =
    `\u274C ts-grm: ${T}`;

export function suppressUnused(_x: any) {}

export type Mutable<T> = 
    T extends object
        ? { -readonly [P in keyof T]: Mutable<T[P]> }
        : T;
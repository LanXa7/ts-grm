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
} & UnionToIntersection<{
    [K in keyof TMembers]: 
        TMembers[K] extends EmbeddedProp<any, infer Nullity, infer FlattenProps>
            ? {
                [DK in keyof FlattenProps as 
                    FollowPrefix<DK & string, K & string>
                ]: FollowNullity<FlattenProps[DK], Nullity>
            }
            : never
}[keyof TMembers]>;

export type UnionToIntersection<U> = 
    (U extends any ? (k: U) => void : never) extends (k: infer I) => void 
        ? I 
        : never;

export type CompilationError<T extends string> =
    `\u274C ts-grm: ${T}`;

export function supressUnused(_x: any) {}
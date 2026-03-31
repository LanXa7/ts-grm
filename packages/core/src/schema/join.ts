import { EmbeddedProp, Prop } from "./prop";
import { AnyModel, OptionalModelKey } from "./model";

export type JoinColumns<
    TTargetKeyProp extends Prop<any, any>
> = [
    JoinColumn<TTargetKeyProp>, 
    ...JoinColumn<TTargetKeyProp>[]
];

export type JoinColumn<
    TTargetKeyProp extends Prop<any, any>
> = 
    TTargetKeyProp extends EmbeddedProp<any, any, infer FlattenProps>
        ? {
            columnName: string,
            referencedSubPath: keyof FlattenProps
        }
        : string | { columnName: string, referencedSubPath?: "" };

export type JoinTable<
    TModel extends AnyModel, 
    TSourceKeyProp extends string,
    TTargetKeyProp extends OptionalModelKey<TModel>
> =
    {
        name?: string,
        joinThisColumns?: WeakTypeJoinColumns,
        joinTargetColumns?: WeakTypeJoinColumns
    } | {
        name?: string,
        joinThis?: {
            keyProp?: TSourceKeyProp,
            columns?: WeakTypeJoinColumns,
            cascade?: CascadeType
        }
        joinTarget?: {
            keyProp?: TTargetKeyProp,
            columns?: WeakTypeJoinColumns,
            cascade?: CascadeType
        }
    };

export type WeakTypeJoinColumns = [
    WeakTypeJoinColumn,
    ...WeakTypeJoinColumn[]
];

export type WeakTypeJoinColumn = string | {
    columnName: string,
    referencedSubPath: string
};

export type CascadeType = "NONE" | "UPDATE" | "DELETE" | "GRM_DELETE";

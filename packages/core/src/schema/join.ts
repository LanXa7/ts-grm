import { AnyModel, OptionalModelKey } from "./model";

export type JoinTable<
    TModel extends AnyModel, 
    TSourceKeyProp extends string,
    TTargetKeyProp extends OptionalModelKey<TModel>
> =
    {
        name?: string,
        joinThisColumns?: JoinColumns,
        joinTargetColumns?: JoinColumns
    } | {
        name?: string,
        joinThis?: {
            keyProp?: TSourceKeyProp,
            columns?: JoinColumns,
            cascade?: CascadeType
        }
        joinTarget?: {
            keyProp?: TTargetKeyProp,
            columns?: JoinColumns,
            cascade?: CascadeType
        }
    };

export type JoinColumns = [
    JoinColumn,
    ...JoinColumn[]
];

export type JoinColumn = string | {
    columnName: string,
    referencedSubPath: string
};

export type CascadeType = "NONE" | "UPDATE" | "DELETE" | "GRM_DELETE";

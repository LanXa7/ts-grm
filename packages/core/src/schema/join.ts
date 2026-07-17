import { AnyModel } from "./model";
import { MiddleEntityJoinTargetKeys, MiddleEntityJoinThisKeys, OptionalModelKey } from "./model_internal_types";
import { AssociationType } from "./prop_internal_types";

export type JoinEntity<
    TMiddleModel extends AnyModel,
    TTargetModel extends AnyModel,
    TAssociationType extends AssociationType,
    TJoinThisProp extends MiddleEntityJoinThisKeys<TMiddleModel, TAssociationType>,
    TJoinTargetProp extends MiddleEntityJoinTargetKeys<TMiddleModel, TTargetModel, TAssociationType> 
> = {
    readonly model: TMiddleModel,
    readonly joinThisProp: TJoinThisProp,
    readonly joinTargetProp: TJoinTargetProp
};

export type JoinTable<
    TModel extends AnyModel, 
    TSourceKeyProp extends string,
    TTargetKeyProp extends OptionalModelKey<TModel>
> =
    {
        readonly name?: string,
        readonly joinThisColumns?: JoinColumns,
        readonly joinTargetColumns?: JoinColumns
    } | {
        readonly name?: string,
        readonly joinThis?: {
            readonly keyProp?: TSourceKeyProp,
            readonly columns?: JoinColumns,
            readonly cascade?: CascadeType
        }
        readonly joinTarget?: {
            readonly keyProp?: TTargetKeyProp,
            readonly columns?: JoinColumns,
            readonly cascade?: CascadeType
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

export type CascadeType = "NONE" | "SET_NULL" | "DELETE" | "GRM_DELETE" | "GRM_SET_NULL";

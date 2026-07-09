/**
 * These internal interfaces are used to optimize the compilation speed
 * 
 * For example:
 * - `TProp extends ScalarProp<infer R, infer Nullity>` is slow
 * - `TProp extends ScalarPropContract<infer R, infer Nullity>` is fast
 */

import { AnyModel, OptionalModelKey } from "./model";

export type AssociationType = "ONE_TO_ONE" | "ONE_TO_MANY" | "MANY_TO_ONE" | "MANY_TO_MANY";

export type NullityType = "NONNULL" | "NULLABLE" | "INPUT_NONNULL";

export type EmbeddedMember = 
    ScalarPropContract<any, any> 
    | ForeignKeyPropLike<OneToOnePropContract<any, any, "OWNING", any, any, any>>
    | ForeignKeyPropLike<ManyToOnePropContract<any, any, "OWNING", any, any, any>>
    | EmbeddedPropContract<any, any, any>;

export type DirectionType = "OWNING" | "INVERSE";

export interface PropContract<T, TNullity extends NullityType> {

    readonly __prop: true;

    readonly __dataType?: T;

    readonly __nullity?: TNullity;
}

export interface ScalarLikePropContract<
    T, 
    TNullity extends NullityType
> extends PropContract<T, TNullity> {

    readonly __scalarLikeProp: true;
}

export interface AssociatedLikePropContract<
    TModel extends AnyModel,
    TNullity extends NullityType
> extends PropContract<TModel, TNullity> {

    readonly __associatedLikeProp: true;
}

export interface ScalarPropContract<
    T, 
    TNullity extends NullityType
> extends ScalarLikePropContract<T, TNullity> {

    readonly __scalarProp: true;
}

export interface StrPropContract<T, TNullity extends NullityType> extends ScalarPropContract<T, TNullity> {

    readonly __strProp: true;
}

export interface I64PropContract<T, TNullity extends NullityType> extends ScalarPropContract<T, TNullity> {

    readonly __i64Prop: true;
}

export interface EnumSetPropContract<T extends string> extends ScalarPropContract<ReadonlyArray<T>, "NONNULL"> {

    readonly __enumSetProp: true;
}

export interface EmbeddedPropContract<
    TProps extends Record<string, EmbeddedMember>,
    TNullity extends NullityType,
    TFlattenProps extends Record<string, any>
> extends PropContract<TProps, TNullity> {

    readonly __embeddedProp: true;

    readonly __flattenProps?: TFlattenProps;
}

export interface AssociatedPropContract<
    TModel extends AnyModel,
    TNullity extends NullityType,
    TDirection extends DirectionType,
    TMiddleTable extends boolean,
    TBackOptionalModelKey extends string,
    TTargetOptionalModelKey extends string
> extends AssociatedLikePropContract<TModel, TNullity> {

    readonly __associatedProp: true;

    readonly __direction?: TDirection;

    readonly __middleTable?: TMiddleTable;

    readonly __backOptionalModelKey?: TBackOptionalModelKey;

    readonly __targetOptionalModelKey?: TTargetOptionalModelKey;
}

export interface ReferencePropContract<
    TModel extends AnyModel, 
    TNullity extends NullityType,
    TDirection extends DirectionType,
    TMiddleTable extends boolean,
    TBackOptionalModelKey extends string,
    TTargetOptionalModelKey extends string
> extends AssociatedPropContract<TModel, TNullity, TDirection, TMiddleTable, TBackOptionalModelKey, TTargetOptionalModelKey> {

    readonly __referenceProp: true;
}

export interface CollectionPropContract<
    TModel extends AnyModel, 
    TDirection extends DirectionType,
    TMiddleTable extends boolean,
    TBackOptionalModelKey extends string,
    TTargetOptionalModelKey extends string
> extends AssociatedPropContract<TModel, "NONNULL", TDirection, TMiddleTable, TBackOptionalModelKey, TTargetOptionalModelKey> {

    readonly __collectionProp: true;
}

export interface OneToOnePropContract<
    TModel extends AnyModel,
    TNullity extends NullityType,
    TDirection extends DirectionType,
    TMiddleTable extends boolean,
    TBackOptionalModelKey extends string,
    TTargetOptionalModelKey extends string
> extends ReferencePropContract<TModel, TNullity, TDirection, TMiddleTable, TBackOptionalModelKey, TTargetOptionalModelKey> {

    readonly __oneToOneProp: true;
}

export interface ManyToOnePropContract<
    TModel extends AnyModel,
    TNullity extends NullityType,
    TDirection extends DirectionType,
    TMiddleTable extends boolean,
    TBackOptionalModelKey extends string,
    TTargetOptionalModelKey extends string
> extends ReferencePropContract<TModel, TNullity, TDirection, TMiddleTable, TBackOptionalModelKey, TTargetOptionalModelKey> {

    readonly __manyToOneProp: true;
}

export interface OneToManyPropContract<
    TModel extends AnyModel,
    TDirection extends DirectionType,
    TMiddleTable extends boolean,
    TBackOptionalModelKey extends string,
    TTargetOptionalModelKey extends string
> extends CollectionPropContract<TModel, TDirection, TMiddleTable, TBackOptionalModelKey, TTargetOptionalModelKey> {

    readonly __oneToManyProp: true;
}

export interface ManyToManyPropContract<
    TModel extends AnyModel,
    TDirection extends DirectionType,
    TMiddleTable extends boolean,
    TBackOptionalModelKey extends string,
    TTargetOptionalModelKey extends string
> extends CollectionPropContract<TModel, TDirection, TMiddleTable, TBackOptionalModelKey, TTargetOptionalModelKey> {

    readonly __manyToManyProp: true;
}

export interface FormulaPropContract<
    T, 
    TNullity extends NullityType
> extends ScalarLikePropContract<T, TNullity> {

    readonly __formulaProp: true;
}

export interface TsFormulaPropContract<
    T, 
    TNullity extends NullityType
> extends FormulaPropContract<T, TNullity> {

    readonly __tsFormulaProp: true;
}

export interface SqlFormulaPropContract<
    T, 
    TNullity extends NullityType
> extends FormulaPropContract<T, TNullity> {

    readonly __sqlFormulaProp: true;
}

export interface CalculatedValuePropContract<
    TValue, 
    TNullity extends NullityType
> extends PropContract<TValue, TNullity> {

    readonly __calculatedValueProp: true;
}

export interface ParameterizedCalculatedValuePropContract<
    TParameter,
    TValue, 
    TNullity extends NullityType
> extends PropContract<TValue, TNullity> {

    readonly __parameterizedCalculatedValueProp: true;

    readonly __parameter?: TParameter;
}

export interface CalculatedReferencePropContract<
    TModel extends AnyModel,
    TNullity extends NullityType
> extends AssociatedLikePropContract<TModel, TNullity> {

    readonly __calculatedReferenceProp: true;
}

export interface ParameterizedCalculatedReferencePropContract<
    TParameter,
    TModel extends AnyModel,
    TNullity extends NullityType
> extends AssociatedLikePropContract<TModel, TNullity> {

    readonly __parameterizedCalculatedReferenceProp: true;

    readonly __parameter?: TParameter;
}

export interface CalculatedCollectionPropContract<
    TModel extends AnyModel
> extends AssociatedLikePropContract<TModel, "NONNULL"> {

    readonly __calculatedCollectionProp: true;
}

export interface ParameterizedCalculatedCollectionPropContract<
    TParameter,
    TModel extends AnyModel
> extends AssociatedLikePropContract<TModel, "NONNULL"> {

    readonly __parameterizedCalculatedCollectionProp: true;

    readonly __parameter?: TParameter;
}

export type ForeignKeyPropLike<T> = 
  T extends ReferencePropContract<infer TModel, any, "OWNING", false, any, infer TTargetOptionalModelKey>
    ? TTargetOptionalModelKey extends Exclude<OptionalModelKey<TModel>, "">
      ? T
      : never
    : never;
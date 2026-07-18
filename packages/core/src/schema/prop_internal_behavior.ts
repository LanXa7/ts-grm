import { ModelOrder, OrderNullsType } from "@/schema/order";
import { 
    AllModelMembers, 
    ModelIdKey, 
    RequiredModelKey, 
    OptionalModelKey, 
    OneToManyMappedByKeys, 
    OneToOneMappedByKeys, 
    ManyToManyMappedByKeys, 
    MiddleEntityJoinThisKeys,
    MiddleEntityJoinTargetKeys
} from "@/schema/model_internal_types";
import { CascadeType, JoinTable, JoinColumns, JoinEntity } from "./join";
import { ArgumentError } from "@/error/common";
import { IsNull } from "@/dsl/utils";
import { Calculator, ParameterizedTargetCalculator, ParameterizedValueCalculator, SqlFormula, TargetCalculator, TsFormula, ValueCalculator } from "./computed";
import { StandardSchemaV1 } from "@standard-schema/spec"; 
import { scalars, ScalarProvider, ScalarType, EnumSetProvider } from "./scalar";
import { 
    AssociatedPropContract, 
    AssociationType, 
    CalculatedCollectionPropContract, 
    CalculatedReferencePropContract, 
    CalculatedValuePropContract, 
    CollectionPropContract, 
    DirectionType, 
    EmbeddedMember, 
    EmbeddedPropContract, 
    EnumSetPropContract, 
    FormulaPropContract, 
    I64PropContract, 
    NullityType, 
    ParameterizedCalculatedCollectionPropContract, 
    ParameterizedCalculatedReferencePropContract, 
    ParameterizedCalculatedValuePropContract, 
    PropContract, 
    ReferencePropContract, 
    ScalarPropContract, 
    SourceKeyOf, 
    SqlFormulaPropContract, 
    StrPropContract, 
    TargetKeyOf, 
    TargetModelOf, 
    TsFormulaPropContract 
} from "./prop_internal_types";
import { AnyModel } from "./model";

export class Prop<T, TNullity extends NullityType> 
implements PropContract<T, TNullity> {

    readonly __prop = true;

    declare readonly __dataType?: T;

    declare readonly __nullity?: TNullity;

    protected constructor(readonly __data: PropData) {}
}

export class ScalarProp<
    T, TNullity extends NullityType = "NONNULL"
> extends Prop<T, TNullity> implements ScalarPropContract<T, TNullity> {

    readonly __scalarLikeProp = true;

    readonly __scalarProp = true;

    constructor(data: PropData) {
        super(data);
    }

    nullable(): ScalarProp<T, "NULLABLE"> {
        return new ScalarProp({...this.__data, nullity: "NULLABLE"})
    }
}

export class StrProp<
    TNullity extends NullityType = "NONNULL"
> extends ScalarProp<string, TNullity> implements StrPropContract<string, TNullity> {

    readonly __strProp = true;

    override nullable(): StrProp<"NULLABLE"> {
        return new StrProp({...this.__data, nullity: "NULLABLE"});
    }
}

export class I64Prop<
    T extends string | number, 
    TNullity extends NullityType = "NONNULL"
> extends ScalarProp<T, TNullity> implements I64PropContract<T, TNullity> {

    readonly __i64Prop = true;

    override nullable(): I64Prop<T, "NULLABLE"> {
        return new I64Prop({...this.__data, nullity: "NULLABLE"});
    }

    asString(): I64Prop<string, TNullity> {
        return new I64Prop({...this.__data});
    }
}

export class EnumSetProp<
    TEnum extends string
> extends ScalarProp<ReadonlyArray<TEnum>, "NONNULL"> implements EnumSetPropContract<TEnum> {

    readonly __enumSetProp = true;
}

export class EmbeddedProp<
    TProps extends Record<string, EmbeddedMember>,
    TNullity extends NullityType,
    TFlattenProps extends Record<string, any>
> extends Prop<TProps, TNullity> implements EmbeddedPropContract<TProps, TNullity, TFlattenProps> {

    readonly __embeddedProp = true;

    declare readonly __flattenProps?: TFlattenProps;

    constructor(data: PropData) {
        super(data)
    }

    get props(): TProps {
        return this.__data.props as TProps;
    }
}

export type FollowPrefix<TKey extends string, TParentKey extends string> =
    `${TParentKey}.${TKey}`;

export type FollowNullity<TProp, TParentNullity extends NullityType> =
    TProp extends ScalarPropContract<infer T, infer Nullity>
        ? ScalarProp<T, CombinedNullity<TParentNullity, Nullity>>
        : never;

export abstract class AssociatedProp<
    TModel extends AnyModel,
    TNullity extends NullityType,
    TDirection extends DirectionType,
    TMiddleTable extends boolean,
    TBackOptionalModelKey extends string,
    TTargetOptionalModelKey extends string
> extends Prop<TModel, TNullity> 
implements AssociatedPropContract<
    TModel, 
    TNullity, 
    TDirection, 
    TMiddleTable, 
    TBackOptionalModelKey, 
    TTargetOptionalModelKey
> {

    readonly __associatedLikeProp = true;
    
    readonly __associatedProp = true;

    declare readonly __direction?: TDirection;

    declare readonly __middleTable?: TMiddleTable;

    declare readonly __backOptionalModelKey?: TBackOptionalModelKey;

    declare readonly __targetOptionalModelKey?: TTargetOptionalModelKey;

    constructor(data: PropData) {
        super(data);
    }

    get targetModel(): TModel {
        return this.__data.targetModel as TModel;
    }
}

export class OneToOneProp<
    TModel extends AnyModel,
    TNullity extends NullityType,
    TDirection extends DirectionType,
    TMiddleTable extends boolean,
    TBackOptionalModelKey extends string,
    TTargetOptionalModelKey extends string
> extends AssociatedProp<TModel, TNullity, TDirection, TMiddleTable, TBackOptionalModelKey, TTargetOptionalModelKey> 
implements ReferencePropContract<TModel, TNullity, TDirection, TMiddleTable, TBackOptionalModelKey, TTargetOptionalModelKey> {

    readonly __referenceProp = true;

    readonly __oneToOneProp = true;

    constructor(data: PropData) {
        super(data);
    }

    nullable(): OneToOneProp<
        TModel, 
        "NULLABLE", 
        TDirection, 
        TMiddleTable,
        TBackOptionalModelKey, 
        TTargetOptionalModelKey
    > {
        return new OneToOneProp(
            {...this.__data, nullity: "NULLABLE"}
        );
    }
}

export class ConfigurableOneToOneProp<
    TModel extends AnyModel,
    TNullity extends NullityType,
    TDirection extends DirectionType,
    TMiddleTable extends boolean,
    TBackOptionalModelKey extends string,
    TTargetOptionalModelKey extends string
> extends OneToOneProp<TModel, TNullity, TDirection, TMiddleTable, TBackOptionalModelKey, TTargetOptionalModelKey> {

    constructor(data: PropData) {
        super(data);
    }

    nullable(): ConfigurableOneToOneProp<
        TModel, 
        "NULLABLE", 
        TDirection, 
        TMiddleTable,
        TBackOptionalModelKey, 
        TTargetOptionalModelKey
    > {
        return new ConfigurableOneToOneProp({...this.__data, nullity: "NULLABLE"});
    }

    mappedBy<TMappedBy extends OneToOneMappedByKeys<TModel>>(
        mappedBy: TMappedBy
    ): OneToOneProp<
        TModel, 
        "NULLABLE", 
        "INVERSE", 
        false,
        TargetKeyOf<AllModelMembers<TModel>[TMappedBy]>, 
        SourceKeyOf<AllModelMembers<TModel>[TMappedBy]>
    > {
        return new OneToOneProp({...this.__data, mappedBy, nullity: "NULLABLE"});
    }

    joinColumns<TTargetKeyProp extends OptionalModelKey<TModel> = "">(
        options: {
            targetKeyProp?: TTargetKeyProp
            columns?: JoinColumns
            cascade?: CascadeType
        }
    ): OneToOneProp<
        TModel, 
        TNullity, 
        "OWNING", 
        false,
        TBackOptionalModelKey, 
        TTargetKeyProp
    >;

    joinColumns(
        ...joinColumns: JoinColumns
    ): OneToOneProp<
        TModel, 
        TNullity, 
        "OWNING", 
        false,
        TBackOptionalModelKey, 
        ModelIdKey<TModel>
    >;

    joinColumns(
        data: any
    ): OneToOneProp<
        TModel, 
        TNullity, 
        "OWNING", 
        false,
        TBackOptionalModelKey, 
        ModelIdKey<TModel>
    > {
        return new OneToOneProp({
            ...this.__data, 
            joinColumns: joinColumnsDataOf(data, this.__data.targetModel)
        });
    }

    joinTable<
        TBackReferencedProp extends string = "",
        TTargetReferencedProp extends OptionalModelKey<TModel> = "",
    >(
        options: JoinTable<TModel, TBackReferencedProp, RequiredModelKey<TModel, TTargetReferencedProp>>
    ): OneToOneProp<
        TModel, 
        TNullity, 
        "OWNING", 
        true,
        TBackReferencedProp, 
        TTargetReferencedProp
    > {
        return new OneToOneProp({
            ...this.__data,
            joinTable: joinTableDataOf(options, this.targetModel)
        });
    }

    joinEntity<
        TMiddleModel extends AnyModel,
        TJoinThisProp extends MiddleEntityJoinThisKeys<TMiddleModel, "ONE_TO_ONE">,
        TJoinTargetProp extends MiddleEntityJoinTargetKeys<TMiddleModel, TModel, "ONE_TO_ONE">
    >(
        options: JoinEntity<
            TMiddleModel, 
            TModel,
            "ONE_TO_ONE",
            TJoinThisProp, 
            TJoinTargetProp
        >
    ): OneToOneProp<
        TargetModelOf<AllModelMembers<TMiddleModel>[TJoinTargetProp]>,
        TNullity,
        "OWNING",
        true,
        TargetKeyOf<AllModelMembers<TMiddleModel>[TJoinThisProp]>,
        TargetKeyOf<AllModelMembers<TMiddleModel>[TJoinTargetProp]>
    > {
        return new OneToOneProp({
            ...this.__data,
            joinEntity: {
                model: options.model,
                joinThisProp: options.joinThisProp,
                joinTargetProp: options.joinTargetProp
            }
        });
    }
}

export class ManyToOneProp<
    TModel extends AnyModel,
    TNullity extends NullityType,
    TDirection extends DirectionType,
    TMiddleTable extends boolean,
    TBackOptionalModelKey extends string,
    TTargetOptionalModelKey extends string
> extends AssociatedProp<TModel, TNullity, TDirection, TMiddleTable, TBackOptionalModelKey, TTargetOptionalModelKey> 
implements ReferencePropContract<TModel, TNullity, TDirection, TMiddleTable, TBackOptionalModelKey, TTargetOptionalModelKey> {

    readonly __referenceProp = true;

    readonly __manyToOneProp = true;

    constructor(data: PropData) {
        super(data);
    }

    nullable(): ManyToOneProp<
        TModel, 
        "NULLABLE", 
        TDirection, 
        TMiddleTable,
        TBackOptionalModelKey, 
        TTargetOptionalModelKey
    > {
        return new ManyToOneProp(
            {...this.__data, nullity: "NULLABLE"}
        );
    }
}

export class ConfigurableManyToOneProp<
    TModel extends AnyModel,
    TNullity extends NullityType,
    TDirection extends DirectionType,
    TMiddleTable extends boolean,
    TBackOptionalModelKey extends string,
    TTargetOptionalModelKey extends string
> extends ManyToOneProp<TModel, TNullity, TDirection, TMiddleTable, TBackOptionalModelKey, TTargetOptionalModelKey> {

    constructor(data: PropData) {
        super(data);
    }

    nullable(): ConfigurableManyToOneProp<
        TModel, 
        "NULLABLE", 
        TDirection, 
        TMiddleTable,
        TBackOptionalModelKey, 
        TTargetOptionalModelKey
    > {
        return new ConfigurableManyToOneProp({...this.__data, nullity: "NULLABLE"});
    }

    joinColumns<TTargetKeyProp extends OptionalModelKey<TModel> = "">(
        options: {
            targetKeyProp?: TTargetKeyProp
            columns?: JoinColumns
            cascade?: CascadeType
        }
    ): ManyToOneProp<
        TModel, 
        TNullity, 
        "OWNING", 
        false,
        TBackOptionalModelKey, 
        TTargetKeyProp
    >;

    joinColumns(
        ...joinColumns: JoinColumns
    ): ManyToOneProp<
        TModel, 
        TNullity, 
        "OWNING", 
        false,
        TBackOptionalModelKey, 
        ModelIdKey<TModel>
    >;

    joinColumns(
        options: any
    ): ManyToOneProp<
        TModel, 
        TNullity, 
        "OWNING", 
        false,
        TBackOptionalModelKey, 
        ModelIdKey<TModel>
    > {
        return new ManyToOneProp({
            ...this.__data,
            joinColumns: joinColumnsDataOf(options, this.__data.targetModel)
        });
    }

    joinTable<
        TBackReferenceProp extends string = "",
        TTargetReferencedProp extends OptionalModelKey<TModel> = ""
    >(
        options: JoinTable<TModel, TBackReferenceProp, RequiredModelKey<TModel, TTargetReferencedProp>>
    ): ManyToOneProp<
        TModel, 
        TNullity, 
        "OWNING", 
        true,
        TBackReferenceProp, 
        TTargetReferencedProp
    > {
        return new ManyToOneProp({
            ...this.__data,
            joinColumns: joinColumnsDataOf(options, this.__data.targetModel)
        });
    }

    joinEntity<
        TMiddleModel extends AnyModel,
        TJoinSourceProp extends MiddleEntityJoinThisKeys<TMiddleModel, "MANY_TO_ONE">,
        TJoinTargetProp extends MiddleEntityJoinTargetKeys<TMiddleModel, TModel, "MANY_TO_ONE"> 
    >(
        options: JoinEntity<
            TMiddleModel, 
            TModel,
            "MANY_TO_ONE",
            TJoinSourceProp, 
            TJoinTargetProp
        >
    ): ManyToOneProp<
        TargetModelOf<AllModelMembers<TMiddleModel>[TJoinTargetProp]>,
        TNullity,
        "OWNING",
        true,
        TargetKeyOf<AllModelMembers<TMiddleModel>[TJoinSourceProp]>,
        TargetKeyOf<AllModelMembers<TMiddleModel>[TJoinTargetProp]>
    > {
        return new ManyToOneProp({
            ...this.__data,
            joinEntity: {
                model: options.model,
                joinThisProp: options.joinThisProp,
                joinTargetProp: options.joinTargetProp
            }
        });
    }
}

export class OneToManyProp<
    TModel extends AnyModel,
    TDirection extends DirectionType,
    TMiddleTable extends boolean,
    TBackOptionalModelKey extends string,
    TTargetOptionalModelKey extends string
> extends AssociatedProp<TModel, "NONNULL", TDirection, TMiddleTable, TBackOptionalModelKey, TTargetOptionalModelKey> 
implements CollectionPropContract<TModel, TDirection, TMiddleTable, TBackOptionalModelKey, TTargetOptionalModelKey> {

    readonly __collectionProp = true;

    readonly __oneToManyProp = true;

    constructor(data: PropData) {
        super(data);
    }

    orderBy(
        ...orders: ModelOrder<TModel>[]
    ): OneToManyProp<
        TModel, 
        TDirection, 
        TMiddleTable,
        TBackOptionalModelKey, 
        TTargetOptionalModelKey
    > {
        const arr: ReadonlyArray<{
            path: string,
            desc: boolean,
            nulls: OrderNullsType
        }> = orders.map(o => 
            typeof o === "object"
                ? {
                    path: o.path as string,
                    desc: o.desc ?? false,
                    nulls: o.nulls ?? "UNSPECIFIED"
                } : {
                    path: o as string,
                    desc: false,
                    nulls: "UNSPECIFIED"
                }
        );
        return new OneToManyProp(
            {...this.__data, orders: arr }
        );
    }
}

export class ConfigurableOneToManyProp<
    TModel extends AnyModel,
    TDirection extends DirectionType,
    TMiddleTable extends boolean,
    TBackOptionalModelKey extends string,
    TTargetOptionalModelKey extends string
> extends OneToManyProp<TModel, TDirection, TMiddleTable, TBackOptionalModelKey, TTargetOptionalModelKey> {

    constructor(data: PropData) {
        super(data);
    }

    joinEntity<
        TMiddleModel extends AnyModel,
        TJoinSourceProp extends MiddleEntityJoinThisKeys<TMiddleModel, "ONE_TO_MANY">,
        TJoinTargetProp extends MiddleEntityJoinTargetKeys<TMiddleModel, TModel, "ONE_TO_MANY"> 
    >(
        options: JoinEntity<
            TMiddleModel, 
            TModel,
            "ONE_TO_MANY",
            TJoinSourceProp, 
            TJoinTargetProp
        >
    ): OneToManyProp<
        TargetModelOf<AllModelMembers<TMiddleModel>[TJoinTargetProp]>,
        "OWNING",
        true,
        TargetKeyOf<AllModelMembers<TMiddleModel>[TJoinSourceProp]>,
        TargetKeyOf<AllModelMembers<TMiddleModel>[TJoinTargetProp]>
    > {
        return new OneToManyProp({
            ...this.__data,
            joinEntity: {
                model: options.model,
                joinThisProp: options.joinThisProp,
                joinTargetProp: options.joinTargetProp
            }
        });
    }

    mappedBy<TMappedBy extends OneToManyMappedByKeys<TModel>>(
        mappedBy: TMappedBy
    ): OneToManyProp<
        TModel, 
        "INVERSE", 
        false,
        TargetKeyOf<AllModelMembers<TModel>[TMappedBy]>, 
        SourceKeyOf<AllModelMembers<TModel>[TMappedBy]>
    > {
        return new OneToManyProp({...this.__data, mappedBy});
    }

    override orderBy(
        ...orders: ModelOrder<TModel>[]
    ): OneToManyProp<
        TModel, 
        TDirection, 
        TMiddleTable,
        TBackOptionalModelKey, 
        TTargetOptionalModelKey
    > {
        return new OneToManyProp(
            {...this.__data, orders: [...orders] as ReadonlyArray<any> }
        );
    }
}

export class ManyToManyProp<
    TModel extends AnyModel,
    TDirection extends DirectionType,
    TMiddleTable extends boolean,
    TBackOptionalModelKey extends string,
    TTargetOptionalModelKey extends string
> extends AssociatedProp<TModel, "NONNULL", TDirection, TMiddleTable, TBackOptionalModelKey, TTargetOptionalModelKey> 
implements CollectionPropContract<TModel, TDirection, TMiddleTable, TBackOptionalModelKey, TTargetOptionalModelKey> {

    readonly __collectionProp = true;

    readonly __manyToManyProp = true;

    constructor(data: PropData) {
        super(data);
    }

    orderBy(
        ...orders: ModelOrder<TModel>[]
    ): ManyToManyProp<
        TModel, 
        TDirection, 
        TMiddleTable,
        TBackOptionalModelKey, 
        TTargetOptionalModelKey
    > {
        return new ManyToManyProp(
            {...this.__data, orders: [...orders] as ReadonlyArray<any> }
        );
    }
}

export class ConfigurableManyToManyProp<
    TModel extends AnyModel,
    TDirection extends DirectionType,
    TMiddleTable extends boolean,
    TBackOptionalModelKey extends string,
    TTargetOptionalModelKey extends string
> extends ManyToManyProp<TModel, TDirection, TMiddleTable, TBackOptionalModelKey, TTargetOptionalModelKey> {

    constructor(data: PropData) {
        super(data);
    }

    mappedBy<TMappedBy extends ManyToManyMappedByKeys<TModel>>(
        mappedBy: TMappedBy
    ): ManyToManyProp<
        TModel, 
        "INVERSE",
        true,
        TargetKeyOf<AllModelMembers<TModel>[TMappedBy]>, 
        SourceKeyOf<AllModelMembers<TModel>[TMappedBy]>
    > {
        return new ManyToManyProp({...this.__data, mappedBy});
    }

    joinTable<
        TBackReferenceProp extends string = "",
        TTargetReferencedProp extends OptionalModelKey<TModel> = ""
    >(
        options: JoinTable<TModel, TBackReferenceProp, RequiredModelKey<TModel, TTargetReferencedProp>>
    ): ManyToManyProp<
        TModel, 
        "OWNING", 
        true,
        TBackReferenceProp, 
        TTargetReferencedProp
    > {
        return new ManyToManyProp({
            ...this.__data,
            joinTable: joinTableDataOf(options, this.__data.targetModel)
        });
    }

    joinEntity<
        TMiddleModel extends AnyModel,
        TJoinSourceProp extends MiddleEntityJoinThisKeys<TMiddleModel, "MANY_TO_MANY">,
        TJoinTargetProp extends MiddleEntityJoinTargetKeys<TMiddleModel, TModel, "MANY_TO_MANY"> 
    >(
        options: JoinEntity<
            TMiddleModel, 
            TModel,
            "MANY_TO_MANY",
            TJoinSourceProp, 
            TJoinTargetProp
        >
    ): ManyToManyProp<
        TargetModelOf<AllModelMembers<TMiddleModel>[TJoinTargetProp]>,
        "OWNING",
        true,
        TargetKeyOf<AllModelMembers<TMiddleModel>[TJoinSourceProp]>,
        TargetKeyOf<AllModelMembers<TMiddleModel>[TJoinTargetProp]>
    > {
        return new ManyToManyProp({
            ...this.__data,
            joinEntity: {
                model: options.model,
                joinThisProp: options.joinThisProp,
                joinTargetProp: options.joinTargetProp
            }
        });
    }

    orderBy(
        ...orders: ModelOrder<TModel>[]
    ): ConfigurableManyToManyProp<
        TModel, 
        TDirection, 
        TMiddleTable,
        TBackOptionalModelKey, 
        TTargetOptionalModelKey
    > {
        return new ConfigurableManyToManyProp(
            {...this.__data, orders: [...orders] as ReadonlyArray<any> }
        );
    }
}

export abstract class FormulaProp<
    T, 
    TNullity extends NullityType
> extends Prop<T, TNullity> 
implements FormulaPropContract<T, TNullity> {

    readonly __scalarLikeProp = true;

    readonly __formulaProp = true;

    constructor(data: PropData) {
        super(data);
    }
}

export class TsFormulaProp<
    T, 
    TNullity extends NullityType
> extends FormulaProp<T, TNullity> 
implements TsFormulaPropContract<T, TNullity> {
 
    readonly __tsFormulaProp = true;

    constructor(data: PropData) {
        super(data);
    }
}

export class SqlFormulaProp<
    T, 
    TNullity extends NullityType
> extends FormulaProp<T, TNullity>
implements SqlFormulaPropContract<T, TNullity> {
 
    readonly __sqlFormulaProp = true;

    constructor(data: PropData) {
        super(data);
    }
}

export class CalculatedValueProp<
    TValue, 
    TNullity extends NullityType
> extends Prop<TValue, TNullity>
implements CalculatedValuePropContract<TValue, TNullity> {

    readonly __calculatedValueProp = true;

    constructor(data: PropData) {
        super(data);
    }
}

export class ParameterizedCalculatedValueProp<
    TParameter,
    TValue, 
    TNullity extends NullityType
> extends Prop<TValue, TNullity>
implements ParameterizedCalculatedValuePropContract<TParameter, TValue, TNullity> {

    readonly __parameterizedCalculatedValueProp = true;

    declare readonly __parameter?: TParameter;

    constructor(data: PropData) {
        super(data);
    }
}

export class CalculatedReferenceProp<
    TModel extends AnyModel,
    TNullity extends NullityType
> extends Prop<TModel, TNullity>
implements CalculatedReferencePropContract<TModel, TNullity> {

    readonly __associatedLikeProp = true;

    readonly __calculatedReferenceProp = true;

    constructor(data: PropData) {
        super(data);
    }
}

export class ParameterizedCalculatedReferenceProp<
    TParameter,
    TModel extends AnyModel,
    TNullity extends NullityType
> extends Prop<TModel, TNullity>
implements ParameterizedCalculatedReferencePropContract<TParameter, TModel, TNullity> {

    readonly __associatedLikeProp = true;

    readonly __parameterizedCalculatedReferenceProp = true;

    declare readonly __parameter?: TParameter;

    constructor(data: PropData) {
        super(data);
    }
}

export class CalculatedCollectionProp<
    TModel extends AnyModel
> extends Prop<TModel, "NONNULL">
implements CalculatedCollectionPropContract<TModel> {

    readonly __associatedLikeProp = true;

    readonly __calculatedCollectionProp = true;

    constructor(data: PropData) {
        super(data);
    }
}

export class ParameterizedCalculatedCollectionProp<
    TParameter,
    TModel extends AnyModel
> extends Prop<TModel, "NONNULL">
implements ParameterizedCalculatedCollectionPropContract<TParameter, TModel> {

    readonly __associatedLikeProp = true;

    readonly __parameterizedCalculatedCollectionProp = true;

    declare readonly __parameter?: TParameter;

    constructor(data: PropData) {
        super(data);
    }
}

export type ScalarPropCreator = {
    
    <TEnum extends string>(
        provider: EnumSetProvider<TEnum>
    ): EnumSetProp<TEnum>;
    
    <TValueType extends StandardSchemaV1>(
        provider: ScalarProvider<TValueType, any>
    ): ScalarProp<StandardSchemaV1.InferOutput<TValueType>>;
}

export function scalarPropCreator(): ScalarPropCreator {
    function impl(
        provider: ScalarProvider<any, any>
    ): ScalarProp<any> {
        if (provider instanceof EnumSetProvider) {
            return new EnumSetProp({...EMPTY_PROP_DEFINITION_DATA, scalarType: provider.sqlType, scalarProvider: provider as any});
        }
        return new ScalarProp({...EMPTY_PROP_DEFINITION_DATA, scalarType: provider.sqlType, scalarProvider: provider});
    };
    return impl as any;
}

export type EnumCreator = {

    <const TValues extends ReadonlyArray<string>>(
        ...values: TValues
    ): ScalarProp<TValues[number]>;

    <TMap extends { readonly [key: string]: string; }>(
        map: TMap
    ): ScalarProp<keyof TMap>;

    <TMap extends { readonly [key: string]: number; }>(
        map: TMap
    ): ScalarProp<keyof TMap>;
}

export function enumCreator(): EnumCreator {
    function impl(...args: ReadonlyArray<any>): ScalarProp<ScalarProp<any>> {
        const scalarProvider = scalars.enumProvider(...args);
        return new ScalarProp({
            ...EMPTY_PROP_DEFINITION_DATA, 
            scalarType: scalarProvider.sqlType,
            scalarProvider
        });
    }
    return impl as any;
}

export type EnumSetCreator = {

    <const TValues extends ReadonlyArray<string>>(
        ...values: TValues
    ): EnumSetProp<TValues[number] & string>;

    <TMap extends { readonly [key: string]: string; }>(
        map: TMap
    ): EnumSetProp<keyof TMap & string>;
}

export function enumSetCreator(): EnumSetCreator {
    function impl(...args: ReadonlyArray<any>): EnumSetProp<any> {
        const scalarProvider = scalars.enumSetProvider(...args);
        return new EnumSetProp({
            ...EMPTY_PROP_DEFINITION_DATA, 
            scalarType: scalarProvider.sqlType,
            scalarProvider: scalarProvider as any
        });
    }
    return impl as any;
}

export type CombinedNullity<
    TNullity1 extends NullityType, 
    TNullity2 extends NullityType
> = TNullity1 extends "NULLABLE"
        ? "NULLABLE"
    : TNullity2 extends "NULLABLE"
        ? "NULLABLE"
    : "NONNULL";

export type PropData = {
    readonly nullity: NullityType;
    readonly scalarType: ScalarType<any> | undefined;
    readonly scalarProvider: ScalarProvider<any, any> | undefined;
    readonly props: Record<string, PropContract<any, any>> | undefined;
    readonly targetModel: ModelRef<AnyModel> | undefined;
    readonly associationType: AssociationType | undefined;
    readonly columnName: string | undefined;
    readonly joinColumns: ForeignKeyData | undefined;
    readonly joinTable: JoinTableData | undefined;
    readonly joinEntity: JoinEntityData | undefined;
    readonly mappedBy: string | undefined,
    readonly orders: ReadonlyArray<{
        readonly path: string;
        readonly desc: boolean;
        readonly nulls: OrderNullsType;
    }> | undefined;
    readonly reference: string | undefined;
    readonly formulaData: FormulaData | undefined;
    readonly calculatorData: CalculatorData | undefined;
};

export type JoinTableData = {
    readonly name: string | undefined;
    readonly joinThis: ForeignKeyData | undefined;
    readonly joinTarget: ForeignKeyData | undefined;
};

export type JoinEntityData = {
    readonly model: AnyModel;
    readonly joinThisProp: string;
    readonly joinTargetProp: string;
};

export type ForeignKeyData = {
    readonly keyProp: string | undefined;
    readonly columns: ReadonlyArray<JoinColumnData>;
    readonly cascade: CascadeType;
};

export type JoinColumnData = {
    readonly columnName: string;
    readonly referencedSubPath: string | undefined;
}

export type FormulaData = {
    readonly kind: "TS";
    readonly formula: TsFormula<any>;
} | {
    readonly kind: "SQL";
    readonly formula: SqlFormula<any>;
};

export type CalculatorKind = 
    "VALUE" |  "NONNULL_REFERENCE" | "NULLABLE_REFERENCE" | "COLLECTION";

export type CalculatorData = {
    readonly kind: CalculatorKind;
    readonly parameterType: StandardSchemaV1 | undefined;
    readonly calculator: Calculator;
};

export const EMPTY_PROP_DEFINITION_DATA: PropData = {
    nullity: "NONNULL",
    scalarType: undefined,
    scalarProvider: undefined,
    props: undefined,
    targetModel: undefined,
    associationType: undefined,
    columnName: undefined,
    joinColumns: undefined,
    joinTable: undefined,
    joinEntity: undefined,
    mappedBy: undefined,
    orders: undefined,
    reference: undefined,
    formulaData: undefined,
    calculatorData: undefined
}

export type ModelRef<TModel extends AnyModel> =
    TModel | (() => TModel);

function joinTableDataOf(
    joinTable: any,
    targetModel: any
): JoinTableData {
    return {
        name: joinTable.name,
        joinThis: joinColumnsDataOf(
            joinTable.joinThis ?? joinTable.joinThisColumns, undefined
        ),
        joinTarget: joinColumnsDataOf(
            joinTable.joinTarget ?? joinTable.joinTargetColumns, targetModel
        )
    };
}

function joinColumnsDataOf(data: any, targetModel: any): ForeignKeyData | undefined {
    if (data === undefined) {
        return undefined;
    }
    if (Array.isArray(data)) {
        const arr = data as JoinColumns;
        const columns = arr.map(joinColumnDataOf);
        if (columns.length > 1) {
            for (const column of columns) {
                if (column.referencedSubPath == null) {
                    throw new ArgumentError(
                        `For multiple join columns, the referencedSubPath of each column must be specified, but the column "${
                            column.columnName
                        }" misses it`
                    );
                }
            }
        }
        return {
            keyProp: targetModel?._idKey,
            columns,
            cascade: "NONE"
        };
    }
    return {
        keyProp: data.keyProp ?? targetModel?._idKey,
        columns: data.columns?.map((c: any) => joinColumnDataOf(c)),
        cascade: data.cascade ?? "NONE"
    };
}

function joinColumnDataOf(data: any): JoinColumnData {
    if (typeof data === "string") {
        return { columnName: data as string, referencedSubPath: undefined };
    }
    return {
        columnName: data.columnName,
        referencedSubPath: data.referencedSubPath !== "" ?
            data.referencedSubPath :
            undefined
    };
}

export type O2OCreator = {

    <TModel extends AnyModel>(
        targetModel: TModel
    ): ConfigurableOneToOneProp<
        TModel, 
        "NONNULL", 
        "OWNING", 
        false,
        "",
        ModelIdKey<TModel>
    >;

    self<
        TSelf extends AnyModel, 
        TTargetKeyProp extends OptionalModelKey<TSelf> = ""
    >(
        selfModelGetter: () => TSelf,
        options?: SelfJoinColumnsOptions<TTargetKeyProp> 
    ): OneToOneProp<
        TSelf,
        "NULLABLE",
        "OWNING",
        false,
        "",
        TTargetKeyProp
    >;

    self<
        TSelf extends AnyModel, 
        TSourceKeyProp extends OptionalModelKey<TSelf> = "",
        TTargetKeyProp extends OptionalModelKey<TSelf> = ""
    >(
        selfModelGetter: () => TSelf,
        options?: SelfJoinTableOptions<TSourceKeyProp, TTargetKeyProp>
    ): OneToOneProp<
        TSelf,
        "NULLABLE",
        "OWNING",
        false,
        TSourceKeyProp,
        TTargetKeyProp
    >;

    self<
        TSelf extends AnyModel, 
        TSourceKeyProp extends OptionalModelKey<TSelf> = "",
        TTargetKeyProp extends OptionalModelKey<TSelf> = ""
    >(
        selfModelGetter: () => TSelf,
        options?: SelfMappedByOptions<TSelf, TSourceKeyProp, TTargetKeyProp>
    ): OneToOneProp<
        TSelf,
        "NULLABLE",
        "INVERSE",
        false,
        TSourceKeyProp,
        TTargetKeyProp
    >;
};

export type M2OCreator = {

    <TModel extends AnyModel>(
        targetModel: TModel
    ): ConfigurableManyToOneProp<
        TModel, 
        "NONNULL", 
        "OWNING", 
        false,
        "",
        ModelIdKey<TModel>
    >;

    self<
        TSelf extends AnyModel, 
        TTargetKeyProp extends OptionalModelKey<TSelf> = ""
    >(
        selfModelGetter: () => TSelf,
        options?: SelfJoinColumnsOptions<TTargetKeyProp>
    ): ManyToOneProp<
        TSelf,
        "NULLABLE",
        "OWNING",
        false,
        "",
        TTargetKeyProp
    >;

    self<
        TSelf extends AnyModel, 
        TSourceKeyProp extends OptionalModelKey<TSelf> = "",
        TTargetKeyProp extends OptionalModelKey<TSelf> = ""
    >(
        selfModelGetter: () => TSelf,
        options?: SelfJoinTableOptions<TSourceKeyProp, TTargetKeyProp>
    ): ManyToOneProp<
        TSelf,
        "NULLABLE",
        "OWNING",
        false,
        TSourceKeyProp,
        TTargetKeyProp
    >;
};

export type O2MCreator = {

    <TModel extends AnyModel>(
        targetModel: TModel
    ): ConfigurableOneToManyProp<
        TModel, 
        "OWNING", 
        false, 
        "", 
        ModelIdKey<TModel>
    >;

    self<
        TSelf extends AnyModel, 
        TSourceKeyProp extends OptionalModelKey<TSelf> = "",
        TTargetKeyProp extends OptionalModelKey<TSelf> = ""
    >(
        selfModelGetter: () => TSelf,
        options: SelfMappedByOptions<TSelf, TSourceKeyProp, TTargetKeyProp>
    ): OneToManyProp<
        TSelf,
        "INVERSE",
        false,
        TSourceKeyProp,
        TTargetKeyProp
    >;
};

export type M2MCreator = {

    <TModel extends AnyModel>(
        targetModel: TModel
    ): ConfigurableManyToManyProp<
        TModel,
        "OWNING",
        true,
        "",
        ModelIdKey<TModel>
    >;

    self<
        TSelf extends AnyModel, 
        TSourceKeyProp extends OptionalModelKey<TSelf> = "",
        TTargetKeyProp extends OptionalModelKey<TSelf> = ""
    >(
        selfModelGetter: () => TSelf,
        options:SelfMappedByOptions<TSelf, TSourceKeyProp, TTargetKeyProp>
    ): ManyToManyProp<
        TSelf,
        "INVERSE",
        false,
        TSourceKeyProp,
        TTargetKeyProp
    >;

    self<TSelf extends AnyModel, 
        TSourceKeyProp extends OptionalModelKey<TSelf> = "",
        TTargetKeyProp extends OptionalModelKey<TSelf> = ""
    >(
        selfModelGetter: () => TSelf,
        options?: SelfJoinTableOptions<TSourceKeyProp, TTargetKeyProp>
    ): ManyToManyProp<
        TSelf,
        "OWNING",
        false,
        TSourceKeyProp,
        TTargetKeyProp
    >;
};

export type FormulaCreator = {

    ts<R>(
        formula: TsFormula<R>
    ): TsFormulaProp<
        NonNullable<R>,
        IsNull<R> extends true ? "NULLABLE" : "NONNULL"
    >;

    sql<R>(
        formula: SqlFormula<R>
    ): SqlFormulaProp<
        NonNullable<R>,
        IsNull<R> extends true ? "NULLABLE" : "NONNULL"
    >;
};

export type CalculatedCreator = {

    value<R>(
        calculator: ValueCalculator<R>
    ): CalculatedValueProp<
        NonNullable<R>, 
        IsNull<R> extends true ? "NULLABLE" : "NONNULL"
    >;

    value<TParameter, R>(
        calculator: ParameterizedValueCalculator<TParameter, R>
    ): ParameterizedCalculatedValueProp<
        TParameter, 
        NonNullable<R>,
        IsNull<R> extends true ? "NULLABLE" : "NONNULL"
    >;

    nonnullReference<
        TTargetModel extends AnyModel
    >(
        calculator: TargetCalculator<TTargetModel>
    ): CalculatedReferenceProp<
        TTargetModel, 
        "NONNULL"
    >;

    nonnullReference<
        TParameter,
        TTargetModel extends AnyModel
    >(
        calculator: ParameterizedTargetCalculator<TParameter, TTargetModel>
    ): ParameterizedCalculatedReferenceProp<
        TParameter, 
        TTargetModel, 
        "NONNULL"
    >;

    nullableReference<
        TTargetModel extends AnyModel
    >(
        calculator: TargetCalculator<TTargetModel>
    ): CalculatedReferenceProp<
        TTargetModel, 
        "NULLABLE"
    >;

    nullableReference<
        TParameter,
        TTargetModel extends AnyModel
    >(
        calculator: ParameterizedTargetCalculator<TParameter, TTargetModel>
    ): ParameterizedCalculatedReferenceProp<
        TParameter,
        TTargetModel, 
        "NULLABLE"
    >;

    collection<
        TTargetModel extends AnyModel
    >(
        calculator: TargetCalculator<TTargetModel>
    ): CalculatedCollectionProp<TTargetModel>;

    collection<
        TParameter,
        TTargetModel extends AnyModel
    >(
        calculator: ParameterizedTargetCalculator<TParameter, TTargetModel>
    ): ParameterizedCalculatedCollectionProp<TParameter, TTargetModel>;
};

type SelfJoinColumnsOptions<
    TTargetKeyProp extends string
> = {
    readonly joinColumns?: JoinColumns | {
        readonly targetKeyProp?: TTargetKeyProp | undefined;
        readonly cascade?: CascadeType | undefined;
        readonly columns?: JoinColumns | undefined;
    } | undefined;
};

type SelfJoinTableOptions<
    TSourceKeyProp extends string, 
    TTargetKeyProp extends string
> = {
    readonly joinTable: {
        readonly name?: string | undefined;
        readonly joinThisColumns?: JoinColumns | undefined;
        readonly joinTargetColumns?: JoinColumns | undefined; 
    } | {
        readonly name?: string | undefined;
        readonly joinThis?: {
            readonly sourceKeyProp?: TSourceKeyProp | undefined;
            readonly cascadeType?: CascadeType | undefined;
            readonly columns?: JoinColumns | undefined;
        } | undefined;
        readonly joinTarget?: {
            readonly targetKeyProp?: TTargetKeyProp | undefined;
            readonly cascadeType?: CascadeType | undefined;
            readonly columns?: JoinColumns | undefined;
        }
    };
};

type SelfMappedByOptions<
    TSelf extends AnyModel,
    TSourceKeyProp extends OptionalModelKey<TSelf> = "", 
    TTargetKeyProp extends OptionalModelKey<TSelf> = ""
> = {
    readonly mappedBy: OptionalModelKey<TSelf>;
    readonly sourceKeyProp?: TSourceKeyProp | undefined;
    readonly targetKeyProp?: TTargetKeyProp | undefined;
};

export function o2oCreator(): O2OCreator {

    function o2o<TModel extends AnyModel>(
        targetModel: ModelRef<TModel>
    ): ConfigurableOneToOneProp<TModel, "NONNULL", "OWNING", false, "", ModelIdKey<TModel>> {
        return new ConfigurableOneToOneProp({
            ...EMPTY_PROP_DEFINITION_DATA, 
            targetModel, 
            associationType: "ONE_TO_ONE"
        });
    }

    function self<
        TSelf extends AnyModel, 
        TSourceKeyProp extends OptionalModelKey<TSelf> = "",
        TTargetKeyProp extends OptionalModelKey<TSelf> = ""
    >(
        selfModelGetter: () => TSelf,
        options?: SelfJoinColumnsOptions<TTargetKeyProp>
            | SelfJoinTableOptions<TSourceKeyProp, TTargetKeyProp>
            | SelfMappedByOptions<TSelf, TSourceKeyProp, TTargetKeyProp>
    ): OneToManyProp<
        TSelf,
        any,
        false,
        TSourceKeyProp,
        TTargetKeyProp
    > {
        const mappedBy = (options as any)?.mappedBy;
        return new OneToManyProp({
            ...EMPTY_PROP_DEFINITION_DATA, 
            targetModel: selfModelGetter, 
            associationType: "ONE_TO_MANY",
            mappedBy: mappedBy != null && typeof mappedBy === "string"
                ? mappedBy
                : mappedBy.opposite,
            joinTable: (options as any)?.joinTable != null 
                ? joinTableDataOf((options as any).joinTable, undefined)
                : undefined,
            joinColumns: (options as any)?.joinColumns != null
                ? joinColumnsDataOf((options as any).joinColumns, undefined)
                : undefined
        });
    }

    (o2o as any).self = self;
    return o2o as O2OCreator;
}

export function m2oCreator(): M2OCreator {
    
    function m2o<TModel extends AnyModel>(
        targetModel: ModelRef<TModel>
    ): ConfigurableManyToOneProp<
        TModel, 
        "NONNULL", 
        "OWNING", 
        false,
        "",
        ModelIdKey<TModel>
    > {
        return new ConfigurableManyToOneProp({
            ...EMPTY_PROP_DEFINITION_DATA, 
            targetModel, 
            associationType: "MANY_TO_ONE"
        });
    }

    function self<TSelf extends AnyModel, 
        TSourceKeyProp extends OptionalModelKey<TSelf> = "",
        TTargetKeyProp extends OptionalModelKey<TSelf> = ""
    >(
        selfModelGetter: () => TSelf,
        options?: SelfJoinColumnsOptions<TTargetKeyProp> 
            | SelfJoinTableOptions<TSourceKeyProp, TTargetKeyProp>
    ): ManyToOneProp<
        TSelf,
        any,
        "OWNING",
        false,
        TSourceKeyProp,
        TTargetKeyProp
    > {
        return new ManyToOneProp({
            ...EMPTY_PROP_DEFINITION_DATA, 
            targetModel: selfModelGetter, 
            associationType: "MANY_TO_ONE",
            joinTable: (options as any)?.joinTable != null 
                ? joinTableDataOf((options as any).joinTable, undefined) 
                : undefined,
            joinColumns: (options as any)?.joinColumns != null 
                ? joinColumnsDataOf((options as any).joinColumns, undefined) 
                : undefined
        });
    }

    (m2o as any).self = self;
    return m2o as any as M2OCreator;
}

export function o2mCreator(): O2MCreator {

    function o2m<TModel extends AnyModel>(
        targetModel: ModelRef<TModel>
    ): ConfigurableOneToManyProp<
        TModel, 
        "OWNING", 
        false, 
        "", 
        ModelIdKey<TModel>
    > {
        return new ConfigurableOneToManyProp({
            ...EMPTY_PROP_DEFINITION_DATA, 
            targetModel, 
            associationType: "ONE_TO_MANY"
        });
    }

    function self<TSelf extends AnyModel, 
        TSourceKeyProp extends OptionalModelKey<TSelf> = "",
        TTargetKeyProp extends OptionalModelKey<TSelf> = ""
    >(
        selfModelGetter: () => TSelf,
        options: SelfMappedByOptions<TSelf, TSourceKeyProp, TTargetKeyProp>
    ): OneToManyProp<
        TSelf,
        "INVERSE",
        false,
        TSourceKeyProp,
        TTargetKeyProp
    > {
        const self = selfModelGetter();
        return new OneToManyProp({
            ...EMPTY_PROP_DEFINITION_DATA, 
            targetModel: self, 
            associationType: "ONE_TO_MANY",
            mappedBy: options.mappedBy
        });
    }

    (o2m as any).self = self;
    return o2m as O2MCreator;
}

export function m2mCreator(): M2MCreator {

    function m2m<TModel extends AnyModel>(
        targetModel: ModelRef<TModel>
    ): ConfigurableManyToManyProp<
        TModel,
        "OWNING",
        true,
        "",
        ModelIdKey<TModel>
    > {
        return new ConfigurableManyToManyProp({
            ...EMPTY_PROP_DEFINITION_DATA, 
            targetModel, 
            associationType: "MANY_TO_MANY"
        });
    }

    function self<
        TSelf extends AnyModel, 
        TSourceKeyProp extends OptionalModelKey<TSelf> = "",
        TTargetKeyProp extends OptionalModelKey<TSelf> = ""
    >(
        selfModelGetter: () => TSelf,
        options?: SelfJoinTableOptions<TSourceKeyProp, TTargetKeyProp>
            | SelfMappedByOptions<TSelf, TSourceKeyProp, TTargetKeyProp>
    ): ManyToManyProp<
        TSelf,
        any,
        false,
        TSourceKeyProp,
        TTargetKeyProp
    > {
        const mappedBy = (options as any)?.mappedBy;
        const self = selfModelGetter();
        return new ManyToManyProp({
            ...EMPTY_PROP_DEFINITION_DATA, 
            targetModel: self, 
            associationType: "MANY_TO_MANY",
            mappedBy: mappedBy,
            joinTable: (options as any)?.joinTable != null 
                ? joinTableDataOf((options as any).joinTable, undefined)
                : undefined 
        });
    }

    (m2m as any).self = self;
    return m2m as M2MCreator;
}

export function formulaCreator(): FormulaCreator {

    function ts<R>(
        formula: TsFormula<R>
    ): TsFormulaProp<
        NonNullable<R>, 
        IsNull<R> extends true ? "NULLABLE" : "NONNULL"
    > {
        return new TsFormulaProp({
            ...EMPTY_PROP_DEFINITION_DATA,
            formulaData: {
                kind: "TS",
                formula
            }
        });
    }

    function sql<R>(
        formula: SqlFormula<R>
    ): SqlFormulaProp<
        NonNullable<R>,
        IsNull<R> extends true ? "NULLABLE" : "NONNULL"
    > {
        return new SqlFormulaProp({
            ...EMPTY_PROP_DEFINITION_DATA,
            formulaData: {
                kind: "SQL",
                formula
            }
        });
    }

    return {
        ts,
        sql
    };
}

export function calculatedCreator(): CalculatedCreator {

    function value(calculator: any): any {
        if (calculator instanceof ParameterizedValueCalculator) {
            return new ParameterizedCalculatedValueProp({
                ...EMPTY_PROP_DEFINITION_DATA,
                calculatorData: {
                    kind: "VALUE",
                    parameterType: calculator.parameterType,
                    calculator
                }
            });
        }
        return new CalculatedValueProp({
            ...EMPTY_PROP_DEFINITION_DATA,
            calculatorData: {
                kind: "VALUE",
                parameterType: undefined,
                calculator
            }
        });
    }

    function nonnullReference(calculator: any): any {
        if (calculator instanceof ParameterizedTargetCalculator) {
            return new ParameterizedCalculatedCollectionProp({
                ...EMPTY_PROP_DEFINITION_DATA,
                calculatorData: {
                    kind: "NONNULL_REFERENCE",
                    parameterType: calculator.parameterType,
                    calculator
                }
            });
        }
        return new CalculatedReferenceProp({
            ...EMPTY_PROP_DEFINITION_DATA,
            calculatorData: {
                kind: "NONNULL_REFERENCE",
                parameterType: undefined,
                calculator
            }
        });
    }

    function nullableReference(calculator: any): any {
        if (calculator instanceof ParameterizedTargetCalculator) {
            return new ParameterizedCalculatedCollectionProp({
                ...EMPTY_PROP_DEFINITION_DATA,
                calculatorData: {
                    kind: "NULLABLE_REFERENCE",
                    parameterType: calculator.parameterType,
                    calculator
                }
            });
        }
        return new CalculatedReferenceProp({
            ...EMPTY_PROP_DEFINITION_DATA,
            calculatorData: {
                kind: "NULLABLE_REFERENCE",
                parameterType: undefined,
                calculator
            }
        });
    }

    function collection(calculator: any): any {
        if (calculator instanceof ParameterizedTargetCalculator) {
            return new ParameterizedCalculatedCollectionProp({
                ...EMPTY_PROP_DEFINITION_DATA,
                calculatorData: {
                    kind: "COLLECTION",
                    parameterType: calculator.parameterType,
                    calculator
                }
            });
        }
        return new CalculatedCollectionProp({
            ...EMPTY_PROP_DEFINITION_DATA,
            calculatorData: {
                kind: "COLLECTION",
                parameterType: undefined,
                calculator
            }
        });
    }

    return {
        value,
        nonnullReference,
        nullableReference,
        collection
    };
}
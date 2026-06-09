import { ModelOrder, OrderNullsType } from "@/schema/order";
import { 
    AllModelMembers, 
    AnyModel, 
    ModelIdKey, 
    RequiredModelKey, 
    OptionalModelKey, 
    OneToManyMappedByKeys, 
    OneToOneMappedByKeys, 
    ManyToManyMappedByKeys, 
    MiddleEntityJoinThisKeys,
    MiddleEntityJoinTargetKeys
} from "@/schema/model";
import { CascadeType, JoinTable, JoinColumns, JoinEntity } from "./join";
import { FlattenMembers } from "@/utils";
import { ArgumentError } from "@/error/common";
import { AtLeastTwo, IsNull } from "@/dsl/utils";
import { Calculator, ParameterizedTargetCalculator, ParameterizedValueCalculator, SqlFormula, TargetCalculator, TsFormula, ValueCalculator } from "./computed";
import { StandardSchemaV1 } from "@standard-schema/spec"; 
import { enumProvider, jsonbProvider, jsonProvider, ScalarProvider } from "./scalar";

export const prop = {

    str(): StrProp {
        return new StrProp({...EMPTY_PROP_DEFINITION_DATA, scalarType: "STR"});
    },

    i8(): ScalarProp<number> {
        return new ScalarProp({...EMPTY_PROP_DEFINITION_DATA, scalarType: "I8"});
    },

    i16(): ScalarProp<number> {
        return new ScalarProp({...EMPTY_PROP_DEFINITION_DATA, scalarType: "I16"});
    },

    i32(): ScalarProp<number> {
        return new ScalarProp({...EMPTY_PROP_DEFINITION_DATA, scalarType: "I32"});
    },

    i64(): I64Prop<number> {
        return new I64Prop({...EMPTY_PROP_DEFINITION_DATA, scalarType: "I64"});
    },

    f32(): ScalarProp<number> {
        return new ScalarProp({...EMPTY_PROP_DEFINITION_DATA, scalarType: "F32"});
    },

    f64(): ScalarProp<number> {
        return new ScalarProp({...EMPTY_PROP_DEFINITION_DATA, scalarType: "F64"});
    },

    num(): ScalarProp<number> {
        return new ScalarProp({...EMPTY_PROP_DEFINITION_DATA, scalarType: "NUM"});
    },

    date(): ScalarProp<Date> {
        return new ScalarProp({...EMPTY_PROP_DEFINITION_DATA, scalarType: "DATE"});
    },

    scalar<TValueType extends StandardSchemaV1>(
        provider: ScalarProvider<TValueType, any>
    ): ScalarProp<StandardSchemaV1.InferOutput<TValueType>> {
        return new ScalarProp({...EMPTY_PROP_DEFINITION_DATA, scalarType: "CUSTOMIZED", scalarProvider: provider});
    },

    enum: enumCreator(),

    json<TValueType extends StandardSchemaV1>(
        valueType: TValueType
    ): ScalarProp<StandardSchemaV1.InferOutput<TValueType>> {
        return this.scalar(jsonProvider(valueType));
    },

    jsonb<TValueType extends StandardSchemaV1>(
        valueType: TValueType
    ): ScalarProp<StandardSchemaV1.InferOutput<TValueType>> {
        return this.scalar(jsonbProvider(valueType));
    },

    embedded<TProps extends Record<string, EmbeddedMember>>(
        props: TProps
    ): EmbeddedProp<TProps, "NONNULL", FlattenMembers<TProps>> {
        return new EmbeddedProp({...EMPTY_PROP_DEFINITION_DATA, props});
    },

    o2o: o2oCreator(),

    m2o: m2oCreator(),

    o2m: o2mCreator(),

    m2m: m2mCreator(),

    formula: formulaCreator(),

    calculated: calculatedCreator()
} as const;

export class Prop<T, TNullity extends NullityType> {

    readonly __phantom?: T;

    __type(): {
        readonly prop: TNullity | true;
    } {
        return { prop: true };
    };

    protected constructor(readonly __data: PropData) {}
}

export class ScalarProp<
    T, TNullity extends NullityType = "NONNULL"
> extends Prop<T, TNullity> {

    override __type(): {
        readonly prop: TNullity | true;
        readonly scalarProp: TNullity | true;
    } {
        return { 
            prop: true, 
            scalarProp: true
        };
    }

    constructor(data: PropData) {
        super(data);
    }

    nullable(): ScalarProp<T, "NULLABLE"> {
        return new ScalarProp({...this.__data, nullity: "NULLABLE"})
    }
}

export class StrProp<
    TNullity extends NullityType = "NONNULL"
> extends ScalarProp<string, TNullity> {

    override __type(): {
        readonly prop: TNullity | true;
        readonly scalarProp: TNullity | true;
        readonly strProp: TNullity | true;
    } {
        return { 
            prop: true, 
            scalarProp: true,
            strProp: true
        };
    }

    override nullable(): StrProp<"NULLABLE"> {
        return new StrProp({...this.__data, nullity: "NULLABLE"});
    }

    length(length: number): StrProp<TNullity> {
        return new StrProp({...this.__data, length});
    }
}

export class I64Prop<
    T extends string | number, 
    TNullity extends NullityType = "NONNULL"
> extends ScalarProp<T, TNullity> {

    override __type(): {
        readonly prop: TNullity | true;
        readonly scalarProp: TNullity | true;
        readonly i64Prop: TNullity | true;
    } {
        return { 
            prop: true, 
            scalarProp: true,
            i64Prop: true
        };
    }

    override nullable(): I64Prop<T, "NULLABLE"> {
        return new I64Prop({...this.__data, nullity: "NULLABLE"});
    }

    asString(): I64Prop<string, TNullity> {
        return new I64Prop({...this.__data});
    }
}

export class EmbeddedProp<
    TProps extends Record<string, EmbeddedMember>,
    TNullity extends NullityType,
    TFlattenProps extends Record<string, any>
> extends Prop<TProps, TNullity> {

    override __type(): {
        readonly prop: TNullity | true;
        readonly embeddedProp: [TNullity, TFlattenProps] | true;
    } {
        return { 
            prop: true, 
            embeddedProp: true 
        };
    }

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
    TProp extends ScalarProp<infer T, infer Nullity>
        ? ScalarProp<T, CombinedNullity<TParentNullity, Nullity>>
        : never;

export abstract class AssociatedProp<
    TModel extends AnyModel,
    TNullity extends NullityType,
    TDirection extends DirectionType,
    TMiddleTable extends boolean,
    TBackOptionalModelKey extends string,
    TTargetOptionalModelKey extends string
> extends Prop<TModel, TNullity> {

    override __type(): {
        readonly prop: TNullity | true;
        readonly associatedProp: [TNullity, TDirection, TMiddleTable, TBackOptionalModelKey, TTargetOptionalModelKey] | true;
    } {
        return { 
            prop: true, 
            associatedProp: true
        };
    }

    constructor(data: PropData) {
        super(data);
    }

    get targetModel(): TModel {
        return this.__data.targetModel as TModel;
    }
}

export interface ReferenceProp<
    TModel extends AnyModel, 
    TNullity extends NullityType,
    TDirection extends DirectionType,
    TMiddleTable extends boolean,
    TBackOptionalModelKey extends string,
    TTargetOptionalModelKey extends string
> extends AssociatedProp<TModel, TNullity, TDirection, TMiddleTable, TBackOptionalModelKey, TTargetOptionalModelKey> {

    __type(): {
        readonly prop: TNullity | true;
        readonly associatedProp: [TNullity, TDirection, TMiddleTable, TBackOptionalModelKey, TTargetOptionalModelKey] | true;
        readonly referenceProp: [TNullity, TDirection, TMiddleTable, TBackOptionalModelKey, TTargetOptionalModelKey] | true;
    };
}

export type ForeignKeyProp<T> = 
  T extends ReferenceProp<infer TModel, any, "OWNING", false, any, infer TTargetOptionalModelKey>
    ? TTargetOptionalModelKey extends Exclude<OptionalModelKey<TModel>, "">
      ? T
      : never
    : never;

export interface CollectionProp<
    TModel extends AnyModel
> {
  
    readonly __phantom?: TModel;

    __type(): {
        readonly collectionProp: true;
    };
}

export class OneToOneProp<
    TModel extends AnyModel,
    TNullity extends NullityType,
    TDirection extends DirectionType,
    TMiddleTable extends boolean,
    TBackOptionalModelKey extends string,
    TTargetOptionalModelKey extends string
> extends AssociatedProp<TModel, TNullity, TDirection, TMiddleTable, TBackOptionalModelKey, TTargetOptionalModelKey> 
implements ReferenceProp<TModel, TNullity, TDirection, TMiddleTable, TBackOptionalModelKey, TTargetOptionalModelKey> {

    override __type(): {
        readonly prop: TNullity | true;
        readonly associatedProp: [TNullity, TDirection, TMiddleTable, TBackOptionalModelKey, TTargetOptionalModelKey] | true;
        readonly referenceProp: [TNullity, TDirection, TMiddleTable, TBackOptionalModelKey, TTargetOptionalModelKey] | true;
        readonly oneToOneProp: [TNullity, TDirection, TMiddleTable, TBackOptionalModelKey, TTargetOptionalModelKey] | true;
    } {
        return { 
            prop: true, 
            associatedProp: true,
            referenceProp: true,
            oneToOneProp: true
        };
    }

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
implements ReferenceProp<TModel, TNullity, TDirection, TMiddleTable, TBackOptionalModelKey, TTargetOptionalModelKey> {

    override __type(): {
        readonly prop: TNullity | true;
        readonly associatedProp: [TNullity, TDirection, TMiddleTable, TBackOptionalModelKey, TTargetOptionalModelKey] | true;
        readonly referenceProp: [TNullity, TDirection, TMiddleTable, TBackOptionalModelKey, TTargetOptionalModelKey] | true;
        readonly manyToOneProp: [TNullity, TDirection, TMiddleTable, TBackOptionalModelKey, TTargetOptionalModelKey] | true;
    } {
        return { 
            prop: true, 
            associatedProp: true,
            referenceProp: true,
            manyToOneProp: true
        };
    }

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
    TNullity extends NullityType,
    TDirection extends DirectionType,
    TMiddleTable extends boolean,
    TBackOptionalModelKey extends string,
    TTargetOptionalModelKey extends string
> extends AssociatedProp<TModel, TNullity, TDirection, TMiddleTable, TBackOptionalModelKey, TTargetOptionalModelKey> 
implements CollectionProp<TModel> {

    override __type(): {
        readonly prop: TNullity | true;
        readonly associatedProp: [TNullity, TDirection, TMiddleTable, TBackOptionalModelKey, TTargetOptionalModelKey] | true;
        readonly collectionProp: true;
        readonly oneToManyProp: [TNullity, TDirection, TMiddleTable, TBackOptionalModelKey, TTargetOptionalModelKey] | true;
    } {
        return { 
            prop: true, 
            associatedProp: true,
            collectionProp: true,
            oneToManyProp: true
        };
    }

    constructor(data: PropData) {
        super(data);
    }

    orderBy(
        ...orders: ModelOrder<TModel>[]
    ): OneToManyProp<
        TModel, 
        TNullity, 
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
    TNullity extends NullityType,
    TDirection extends DirectionType,
    TMiddleTable extends boolean,
    TBackOptionalModelKey extends string,
    TTargetOptionalModelKey extends string
> extends OneToManyProp<TModel, TNullity, TDirection, TMiddleTable, TBackOptionalModelKey, TTargetOptionalModelKey> {

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
        TNullity,
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
        TNullity, 
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
        TNullity, 
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
    TNullity extends NullityType,
    TDirection extends DirectionType,
    TMiddleTable extends boolean,
    TBackOptionalModelKey extends string,
    TTargetOptionalModelKey extends string
> extends AssociatedProp<TModel, TNullity, TDirection, TMiddleTable, TBackOptionalModelKey, TTargetOptionalModelKey> 
implements CollectionProp<TModel> {

    override __type(): {
        readonly prop: TNullity | true;
        readonly associatedProp: [TNullity, TDirection, TMiddleTable, TBackOptionalModelKey, TTargetOptionalModelKey] | true;
        readonly collectionProp: true;
        readonly manyToManyProp: [TNullity, TDirection, TMiddleTable, TBackOptionalModelKey, TTargetOptionalModelKey] | true;
    } {
        return { 
            prop: true, 
            associatedProp: true,
            collectionProp: true,
            manyToManyProp: true
        };
    }

    constructor(data: PropData) {
        super(data);
    }

    orderBy(
        ...orders: ModelOrder<TModel>[]
    ): ManyToManyProp<
        TModel, 
        TNullity, 
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
    TNullity extends NullityType,
    TDirection extends DirectionType,
    TMiddleTable extends boolean,
    TBackOptionalModelKey extends string,
    TTargetOptionalModelKey extends string
> extends ManyToManyProp<TModel, TNullity, TDirection, TMiddleTable, TBackOptionalModelKey, TTargetOptionalModelKey> {

    constructor(data: PropData) {
        super(data);
    }

    mappedBy<TMappedBy extends ManyToManyMappedByKeys<TModel>>(
        mappedBy: TMappedBy
    ): ManyToManyProp<
        TModel, 
        TNullity, 
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
        TNullity, 
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
        TNullity,
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
        TNullity, 
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
> extends Prop<T, TNullity> {

    abstract __type(): {
        readonly prop: TNullity | true;
        readonly formulaProp: [T, TNullity] | true;
    };

    constructor(data: PropData) {
        super(data);
    }
}

export class TsFormulaProp<
    T, 
    TNullity extends NullityType
> extends FormulaProp<T, TNullity> {
 
    override __type(): {
        readonly prop: TNullity | true;
        readonly formulaProp: [T, TNullity] | true;
        readonly tsFormulaProp: TNullity | true;
    } {
        return { 
            prop: true, 
            formulaProp: true,
            tsFormulaProp: true
        };
    }

    constructor(data: PropData) {
        super(data);
    }
}

export class SqlFormulaProp<
    T, 
    TNullity extends NullityType
> extends FormulaProp<T, TNullity> {
 
    override __type(): {
        readonly prop: TNullity | true;
        readonly formulaProp: [T, TNullity] | true;
        readonly sqlFormulaProp: TNullity | true;
    } {
        return { 
            prop: true, 
            formulaProp: true,
            sqlFormulaProp: true
        };
    }

    constructor(data: PropData) {
        super(data);
    }
}

export class CalculatedValueProp<
    TValue, 
    TNullity extends NullityType
> extends Prop<TValue, TNullity> {

    override __type(): {
        readonly prop: TNullity | true;
        readonly calculatedValueProp: [TValue, TNullity] | true;
    } {
        return { 
            prop: true, 
            calculatedValueProp: true
        };
    }

    constructor(data: PropData) {
        super(data);
    }
}

export class ParameterizedCalculatedValueProp<
    TParameter,
    TValue, 
    TNullity extends NullityType
> extends Prop<TValue, TNullity> {

    override __type(): {
        readonly prop: TNullity | true;
        readonly parameterizedCalculatedValueProp: [TParameter, TValue, TNullity] | true;
    } {
        return { 
            prop: true, 
            parameterizedCalculatedValueProp: true
        };
    }

    constructor(data: PropData) {
        super(data);
    }
}

export class CalculatedReferenceProp<
    TModel extends AnyModel,
    TNullity extends NullityType
> extends Prop<TModel, TNullity> {

    override __type(): {
        readonly prop: TNullity | true;
        readonly calculatedReferenceProp: [TModel, TNullity] | true;
    } {
        return { 
            prop: true, 
            calculatedReferenceProp: true
        };
    }

    constructor(data: PropData) {
        super(data);
    }
}

export class ParameterizedCalculatedReferenceProp<
    TParameter,
    TModel extends AnyModel,
    TNullity extends NullityType
> extends Prop<TModel, TNullity> {

    override __type(): {
        readonly prop: TNullity | true;
        readonly parameterizedCalculatedReferenceProp: [TParameter, TModel, TNullity] | true;
    } {
        return { 
            prop: true, 
            parameterizedCalculatedReferenceProp: true
        };
    }

    constructor(data: PropData) {
        super(data);
    }
}

export class CalculatedCollectionProp<
    TModel extends AnyModel
> extends Prop<TModel, "NONNULL"> {

    override __type(): {
        readonly prop: "NONNULL" | true;
        readonly calculatedCollectionProp: [TModel, "NONNULL"] | true;
    } {
        return { 
            prop: true, 
            calculatedCollectionProp: true
        };
    }

    constructor(data: PropData) {
        super(data);
    }
}

export class ParameterizedCalculatedCollectionProp<
    TParameter,
    TModel extends AnyModel
> extends Prop<TModel, "NONNULL"> {

    override __type(): {
        readonly prop: "NONNULL" | true;
        readonly parameterizedCalculatedCollectionProp: [TParameter, TModel, "NONNULL"] | true;
    } {
        return { 
            prop: true, 
            parameterizedCalculatedCollectionProp: true
        };
    }

    constructor(data: PropData) {
        super(data);
    }
}

type EnumCreator = {

    <TValues extends AtLeastTwo<string>>(
        ...values: TValues
    ): ScalarProp<TValues[number]>;

    <TMap extends { readonly [key: string]: string; }>(
        map: TMap
    ): ScalarProp<keyof TMap>;

    <TMap extends { readonly [key: string]: number; }>(
        map: TMap
    ): ScalarProp<keyof TMap>;
}

function enumCreator(): EnumCreator {
    function impl(...args: ReadonlyArray<any>): ScalarProp<ScalarProp<any>> {
        return new ScalarProp({
            ...EMPTY_PROP_DEFINITION_DATA, 
            scalarType: "CUSTOMIZED",
            scalarProvider: enumProvider(...args)
        });
    }
    return impl as any;
}

export type AssociationType = "ONE_TO_ONE" | "ONE_TO_MANY" | "MANY_TO_ONE" | "MANY_TO_MANY";

export type NullityType = "NONNULL" | "NULLABLE" | "INPUT_NONNULL";

export type CombinedNullity<
    TNullity1 extends NullityType, 
    TNullity2 extends NullityType
> = TNullity1 extends "NULLABLE"
        ? "NULLABLE"
    : TNullity2 extends "NULLABLE"
        ? "NULLABLE"
    : "NONNULL";

type DirectionType = "OWNING" | "INVERSE";

export type EmbeddedMember = 
    ScalarProp<any, any> 
    | ForeignKeyProp<OneToOneProp<any, any, "OWNING", any, any, any>>
    | ForeignKeyProp<ManyToOneProp<any, any, "OWNING", any, any, any>>
    | EmbeddedProp<any, any, any>;

export type PropData = {
    readonly nullity: NullityType;
    readonly scalarType: ScalarType | undefined;
    readonly scalarProvider: ScalarProvider<any, any> | undefined;
    readonly length: number | undefined;
    readonly props: Record<string, Prop<any, any>> | undefined;
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

export type ScalarType = 
    "STR" 
    | "I8" | "I16" | "I32" | "I64" 
    | "F32" | "F64" | "NUM" 
    | "DATE"
    | "BOOL"
    | "CUSTOMIZED";

const EMPTY_PROP_DEFINITION_DATA: PropData = {
    nullity: "NONNULL",
    scalarType: undefined,
    scalarProvider: undefined,
    length: undefined,
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

export type TargetModelOf<TProp> =
    TProp extends AssociatedProp<infer TargetModel, any, any, any, any, any>
        ? TargetModel
        : never;

export type SourceKeyOf<TProp> =
    TProp extends AssociatedProp<infer _, any, any, any, infer SourceKey, any>
        ? SourceKey
        : never;

export type TargetKeyOf<TProp> =
    TProp extends AssociatedProp<infer _, any, any, any, any, infer TargetKey>
        ? TargetKey
        : never;
        
export type DirectTypeOf<TProp> =
    TProp extends Prop<infer R, any>
        ? R
        : never;

export type NullityOf<TProp> =
    TProp extends Prop<any, infer R>
        ? R
        : never;

type ModelRef<TModel extends AnyModel> =
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
        "NONNULL", 
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
        "NONNULL",
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
        "NONNULL",
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
        "NONNULL",
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
        "NONNULL",
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

function o2oCreator(): O2OCreator {

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

function m2oCreator(): M2OCreator {
    
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

function o2mCreator(): O2MCreator {

    function o2m<TModel extends AnyModel>(
        targetModel: ModelRef<TModel>
    ): ConfigurableOneToManyProp<
        TModel, 
        "NONNULL", 
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
        "NONNULL",
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

function m2mCreator(): M2MCreator {

    function m2m<TModel extends AnyModel>(
        targetModel: ModelRef<TModel>
    ): ConfigurableManyToManyProp<
        TModel,
        "NONNULL",
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
        "NONNULL",
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

function formulaCreator(): FormulaCreator {

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

function calculatedCreator(): CalculatedCreator {

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
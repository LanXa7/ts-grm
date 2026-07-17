import { FlattenMembers } from "@/utils";
import { StandardSchemaV1 } from "@standard-schema/spec"; 
import { scalars, ScalarType } from "./scalar";
import { calculatedCreator, EmbeddedProp, EMPTY_PROP_DEFINITION_DATA, enumCreator, enumSetCreator, formulaCreator, I64Prop, m2mCreator, m2oCreator, o2mCreator, o2oCreator, ScalarProp, scalarPropCreator, StrProp } from "./prop_internal_behavior";
import { EmbeddedMember } from "./prop_internal_types";

export const prop = {

    str(length: number): StrProp {
        return new StrProp({...EMPTY_PROP_DEFINITION_DATA, scalarType: ScalarType.str(length)});
    },

    i8(): ScalarProp<number> {
        return new ScalarProp({...EMPTY_PROP_DEFINITION_DATA, scalarType: ScalarType.I8});
    },

    i16(): ScalarProp<number> {
        return new ScalarProp({...EMPTY_PROP_DEFINITION_DATA, scalarType: ScalarType.I16});
    },

    i32(): ScalarProp<number> {
        return new ScalarProp({...EMPTY_PROP_DEFINITION_DATA, scalarType: ScalarType.I32});
    },

    i64(): I64Prop<number> {
        return new I64Prop({...EMPTY_PROP_DEFINITION_DATA, scalarType: ScalarType.I64});
    },

    f32(): ScalarProp<number> {
        return new ScalarProp({...EMPTY_PROP_DEFINITION_DATA, scalarType: ScalarType.F32});
    },

    f64(): ScalarProp<number> {
        return new ScalarProp({...EMPTY_PROP_DEFINITION_DATA, scalarType: ScalarType.F64});
    },

    num(): ScalarProp<number> {
        return new ScalarProp({...EMPTY_PROP_DEFINITION_DATA, scalarType: ScalarType.NUM});
    },

    date(): ScalarProp<Date> {
        return new ScalarProp({...EMPTY_PROP_DEFINITION_DATA, scalarType: ScalarType.DATE});
    },

    scalar: scalarPropCreator(),

    enum: enumCreator(),

    enumSet: enumSetCreator(),

    json<TValueType extends StandardSchemaV1>(
        valueType: TValueType
    ): ScalarProp<StandardSchemaV1.InferOutput<TValueType>> {
        return this.scalar(scalars.jsonProvider(valueType));
    },

    jsonb<TValueType extends StandardSchemaV1>(
        valueType: TValueType
    ): ScalarProp<StandardSchemaV1.InferOutput<TValueType>> {
        return this.scalar(scalars.jsonbProvider(valueType));
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

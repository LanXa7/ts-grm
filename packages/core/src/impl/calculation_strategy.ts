import { ParameterizedTargetCalculatorFn, ParameterizedValueCalculatorFn, TargetCalculatorFn, ValueCalculatorFn } from "@/schema/computed";
import { StandardSchemaV1 } from '@standard-schema/spec';
import { EntityProp } from ".";

export type CalculationStrategyKind = CalculationStrategy["kind"];

export type CalculationStrategy = 
    ValueCalculationStragegy
    | ParameterizedValueCalculationStragegy
    | ReferenceCalculationStragegy
    | ParameterizedReferenceCalculationStragegy
    | CollectionCalculationStragegy
    | ParameterizedCollectionCalculationStragegy;

export type ValueCalculationStragegy = {
    readonly kind: "VALUE";
    readonly sourceKeyProp: EntityProp;
    readonly parameterType: undefined;
    readonly nullable: boolean;
    readonly fn: ValueCalculatorFn<any, any>;
};

export type ParameterizedValueCalculationStragegy = {
    readonly kind: "PARAMETERIZED_VALUE";
    readonly sourceKeyProp: EntityProp;
    readonly parameterType: StandardSchemaV1;
    readonly nullable: boolean;
    readonly fn: ParameterizedValueCalculatorFn<any, any, any>;
};

export type ReferenceCalculationStragegy = {
    readonly kind: "REFERENCE";
    readonly sourceKeyProp: EntityProp;
    readonly parameterType: undefined;
    readonly nullable: boolean;
    readonly fn: TargetCalculatorFn<any, any>
};

export type ParameterizedReferenceCalculationStragegy = {
    readonly kind: "PARAMETERIZED_REFERENCE";
    readonly sourceKeyProp: EntityProp;
    readonly parameterType: StandardSchemaV1;
    readonly nullable: boolean;
    readonly fn: ParameterizedTargetCalculatorFn<any, any, any>;
};

export type CollectionCalculationStragegy = {
    readonly kind: "COLLECTION";
    readonly sourceKeyProp: EntityProp;
    readonly parameterType: undefined;
    readonly fn: TargetCalculatorFn<any, any>
};

export type ParameterizedCollectionCalculationStragegy = {
    readonly kind: "PARAMETERIZED_COLLECTION";
    readonly sourceKeyProp: EntityProp;
    readonly parameterType: StandardSchemaV1;
    readonly fn: ParameterizedTargetCalculatorFn<any, any, any>;
};

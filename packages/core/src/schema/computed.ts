import { EntityTable, Expression, SqlClient } from "@/dsl";
import { AllModelMembers, AnyModel, CalculatorSourceKeys, ModelIdKey } from "./model";
import { SimpleDataTypeOf, View } from "./dto";
import { z } from "zod";

export class TsFormula<TValue> {

    private constructor(
        readonly dependency: () => View<AnyModel, any>,
        readonly fn: TsFormulaFn<any, TValue>
    ) {}

    static of<
        TData, 
        TValue
    >(
        options: {
            readonly dependency: () => View<AnyModel, TData>
            readonly fn: TsFormulaFn<TData, TValue>;
        }
    ): TsFormula<TValue> {
        return new TsFormula(options.dependency, options.fn as any);
    }
}

export type TsFormulaFn<
    TBaseShape,
    TValue
> = (data: TBaseShape) => TValue;

export class SqlFormula<TValue> {

    private constructor(
        readonly sourceModel: () => AnyModel,
        readonly fn: SqlFormulaFn<AnyModel, TValue>
    ) {
    }

    static of<
        TSourceModel extends AnyModel, 
        TValue
    >(options: {
        readonly sourceModel: () => TSourceModel,
        readonly fn: SqlFormulaFn<TSourceModel, TValue>
    }): SqlFormula<TValue> {
        return new SqlFormula(
            options.sourceModel,
            options.fn as any
        );
    }
}

export type SqlFormulaFn<TSourceModel extends AnyModel, TValue> =
    (table: EntityTable<TSourceModel, "NONE">) => Expression<TValue>;

export abstract class Calculator {

    protected constructor(
        readonly sourceModel: () => AnyModel,
        readonly sourceKeyPropName: string | undefined,
    ) {}

    abstract get parameterType(): z.ZodType | undefined;

    static valueOf<
        TSourceModel extends AnyModel,
        TValueSchema extends z.ZodType,
        TSourceKeyProp extends CalculatorSourceKeys<TSourceModel> & string = ModelIdKey<TSourceModel>
    >(
        options: {
            readonly sourceModel: () => TSourceModel,
            readonly sourceKeyProp?: TSourceKeyProp,
            readonly valueType: z.ZodType,
            readonly fn: ValueCalculatorFn<
                SimpleDataTypeOf<AllModelMembers<TSourceModel>[TSourceKeyProp], "UNDEFINED">, 
                z.infer<TValueSchema>
            >
        }
    ): ValueCalculator<z.infer<TValueSchema>> {
        return new (ValueCalculator as any)(
            options.sourceModel,
            options.sourceKeyProp,
            options.valueType,
            options.fn
        );
    }

    static parameterizedValueOf<
        TParameterSchema extends z.ZodType,
        TSourceModel extends AnyModel,
        TValueSchema extends z.ZodType,
        TSourceKeyProp extends CalculatorSourceKeys<TSourceModel> & string = ModelIdKey<TSourceModel>
    >(
        options: {
            readonly parameterType: TParameterSchema,
            readonly sourceModel: () => TSourceModel,
            readonly sourceKeyProp?: TSourceKeyProp,
            readonly valueType: z.ZodType,
            readonly fn: ParameterizedValueCalculatorFn<
                z.infer<TParameterSchema>,
                SimpleDataTypeOf<AllModelMembers<TSourceModel>[TSourceKeyProp], "UNDEFINED">, 
                z.infer<TValueSchema>
            >
        }
    ): ParameterizedValueCalculator<z.infer<TParameterSchema>, z.infer<TValueSchema>> {
        return new (ParameterizedValueCalculator as any)(
            options.parameterType,
            options.sourceModel,
            options.sourceKeyProp,
            options.valueType,
            options.fn
        );
    }

    static targetOf<
        TSourceModel extends AnyModel,
        TTargetModel extends AnyModel,
        TSourceKeyProp extends keyof CalculatorSourceKeys<TSourceModel> & string = ModelIdKey<TSourceModel>
    >(
        options: {
            readonly sourceModel: () => TSourceModel,
            readonly sourceKeyProp?: TSourceKeyProp,
            readonly targetModel: () => TTargetModel,
            readonly fn: TargetCalculatorFn<
                SimpleDataTypeOf<AllModelMembers<TSourceModel>[TSourceKeyProp], "UNDEFINED">, 
                TTargetModel
            >
        }
    ): TargetCalculator<TTargetModel> {
        return new (TargetCalculator as any)(
            options.sourceModel,
            options.sourceKeyProp,
            options.targetModel,
            options.fn
        );
    }

    static parameterizedTargetOf<
        TParameterSchema extends z.ZodType,
        TSourceModel extends AnyModel,
        TTargetModel extends AnyModel,
        TSourceKeyProp extends keyof CalculatorSourceKeys<TSourceModel> & string = ModelIdKey<TSourceModel>
    >(
        options: {
            readonly parameterType: TParameterSchema,
            readonly sourceModel: () => TSourceModel,
            readonly sourceKeyProp?: TSourceKeyProp,
            readonly targetModel: () => TTargetModel,
            readonly fn: ParameterizedTargetCalculatorFn<
                z.infer<TParameterSchema>,
                SimpleDataTypeOf<AllModelMembers<TSourceModel>[TSourceKeyProp], "UNDEFINED">, 
                TTargetModel
            >
        }
    ): ParameterizedTargetCalculator<
        z.infer<TParameterSchema>,
        TTargetModel
    > {
        return new (ParameterizedTargetCalculator as any)(
            options.parameterType,
            options.sourceModel,
            options.sourceKeyProp,
            options.targetModel,
            options.fn
        );
    }
}

export class ValueCalculator<TValue> extends Calculator {

    private constructor(
        sourceModel: () => AnyModel,
        sourceKeyPropName: string | undefined,
        readonly valueType: z.ZodType,
        readonly fn: ValueCalculatorFn<any, TValue>
    ) {
        super(sourceModel, sourceKeyPropName);
    }

    get parameterType(): undefined {
        return undefined;
    }
}

export type ValueCalculatorFn<TKey, TValue> =
    (
        ctx: ValueCalculatorContext<TKey>
    ) => Promise<ReadonlyArray<[TKey, TValue]>>;

export type ValueCalculatorContext<
    TKey
> = {
    readonly sqlClient: SqlClient;
    readonly keys: ReadonlyArray<TKey>;
};

export class ParameterizedValueCalculator<TParameter, TValue> extends Calculator {

    private constructor(
        readonly parameterType: z.ZodType,
        sourceModel: () => AnyModel,
        sourceKeyPropName: string | undefined,
        readonly valueType: z.ZodType,
        readonly fn: ParameterizedValueCalculatorFn<TParameter, any, TValue>
    ) {
        super(sourceModel, sourceKeyPropName);
    }
}

export type ParameterizedValueCalculatorContext<
    TParameter,
    TKey
> = {
    readonly sqlClient: SqlClient;
    readonly keys: ReadonlyArray<TKey>;
    readonly parameter: TParameter
};

export type ParameterizedValueCalculatorFn<TParameter, TKey, TValue> =
    (
        ctx: ParameterizedValueCalculatorContext<TParameter, TKey>
    ) => Promise<ReadonlyArray<[TKey, TValue]>>;

export class TargetCalculator<TTargetModel extends AnyModel> extends Calculator {

    private constructor(
        sourceModel: () => AnyModel,
        sourceKeyPropName: string | undefined,
        readonly targetModel:() => AnyModel,
        readonly fn: TargetCalculatorFn<any, TTargetModel>
    ) {
        super(sourceModel, sourceKeyPropName);
    }

    get parameterType(): undefined {
        return undefined;
    }
}

export type TargetCalculatorFn<TKey, TTargetModel extends AnyModel> =
    <X>(
        ctx: TargetCalculatorContext<TKey, TTargetModel, X>
    ) => Promise<ReadonlyArray<[TKey, X]>>;

export type TargetCalculatorContext<
    TKey, 
    TTargetModel extends AnyModel, 
    X
> = {
    readonly sqlClient: SqlClient;
    readonly keys: ReadonlyArray<TKey>;
    readonly view: View<TTargetModel, X>;
};

export class ParameterizedTargetCalculator<
    TParameter,
    TTargetModel extends AnyModel
> extends Calculator {

    private constructor(
        readonly parameterType: z.ZodType,
        sourceModel: () => AnyModel,
        sourceKeyPropName: string | undefined,
        readonly targetModel: () => AnyModel,
        readonly fn: ParameterizedTargetCalculatorFn<TParameter, any, TTargetModel>
    ) {
        super(sourceModel, sourceKeyPropName);
    }
}

export type ParameterizedTargetCalculatorFn<TParameter, TKey, TTargetModel extends AnyModel> =
    <X>(
        ctx: ParameterizedTargetCalculatorContext<TParameter, TKey, TTargetModel, X>
    ) => Promise<ReadonlyArray<[TKey, X]>>;

export type ParameterizedTargetCalculatorContext<
    TParameter,
    TKey, 
    TTargetModel extends AnyModel, 
    X
> = {
    readonly parameter: TParameter;
    readonly sqlClient: SqlClient;
    readonly keys: ReadonlyArray<TKey>;
    readonly view: View<TTargetModel, X>;
};

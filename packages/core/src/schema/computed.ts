import { EntityTable, Expression, SqlClient } from "@/dsl";
import { AllModelMembers, AnyModel, CalcuatorSourceKeys, ModelIdKey } from "./model";
import { SimpleDataTypeOf, View } from "./dto";
import { AbstractEntityTable } from "@/impl";
import { z } from "zod";

export class TsFormula<TValue> {

    private constructor(
        readonly view: () => View<AnyModel, any>,
        readonly fn: TsFormulaFn<any, TValue>
    ) {}

    static of<
        TData, 
        TValue
    >(
        options: {
            readonly view: () => View<AnyModel, TData>
            readonly fn: TsFormulaFn<TData, TValue>;
        }
    ): TsFormula<TValue> {
        return new TsFormula(options.view, options.fn as any);
    }
}

export type TsFormulaFn<
    TBaseShape,
    TValue
> = (data: TBaseShape) => TValue;

export class SqlFormula<TValue> {

    private constructor(
        readonly sourceModel: () => AnyModel,
        readonly fn: (table: AbstractEntityTable) => Expression<TValue>
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

    protected constructor() {}

    abstract get isParameterized(): boolean;

    static valueOf<
        TSourceModel extends AnyModel,
        TValue,
        TSourceKeyProp extends CalcuatorSourceKeys<TSourceModel> & string = ModelIdKey<TSourceModel>
    >(
        options: {
            readonly sourceModel: () => TSourceModel,
            readonly sourceKeyProp?: TSourceKeyProp,
            readonly fn: ValueCalculatorFn<
                SimpleDataTypeOf<AllModelMembers<TSourceModel>[TSourceKeyProp], "UNDEFINED">, 
                TValue
            >
        }
    ): ValueCalculator<TValue> {
        return new (ValueCalculator as any)(
            options.sourceModel,
            options.sourceKeyProp,
            options.fn
        );
    }

    static parameterizedValueOf<
        TParameterSchema extends z.ZodType,
        TSourceModel extends AnyModel,
        TValue,
        TSourceKeyProp extends CalcuatorSourceKeys<TSourceModel> & string = ModelIdKey<TSourceModel>
    >(
        options: {
            readonly parameterType: TParameterSchema,
            readonly sourceModel: () => TSourceModel,
            readonly sourceKeyProp?: TSourceKeyProp,
            readonly fn: ParameterizedValueCalculatorFn<
                z.infer<TParameterSchema>,
                SimpleDataTypeOf<AllModelMembers<TSourceModel>[TSourceKeyProp], "UNDEFINED">, 
                TValue
            >
        }
    ): ParameterizedValueCalculator<z.infer<TParameterSchema>, TValue> {
        return new (ParameterizedValueCalculator as any)(
            options.parameterType,
            options.sourceModel,
            options.sourceKeyProp,
            options.fn
        );
    }

    static targetOf<
        TSourceModel extends AnyModel,
        TTargetModel extends AnyModel,
        TSourceKeyProp extends keyof CalcuatorSourceKeys<TSourceModel> & string = ModelIdKey<TSourceModel>
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
            options.fn
        );
    }

    static parameterizedTargetOf<
        TParameterSchema extends z.ZodType,
        TSourceModel extends AnyModel,
        TTargetModel extends AnyModel,
        TSourceKeyProp extends keyof CalcuatorSourceKeys<TSourceModel> & string = ModelIdKey<TSourceModel>
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
            options.fn
        );
    }
}

export class ValueCalculator<TValue> extends Calculator {

    private constructor(
        readonly sourceModel: () => AnyModel,
        readonly sourceKeyPropName: string | undefined,
        readonly fn: ValueCalculatorFn<any, TValue>
    ) {
        super();
    }

    get isParameterized(): false {
        return false;
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
        readonly sourceModel: () => AnyModel,
        readonly sourceKeyPropName: string | undefined,
        readonly fn: ParameterizedValueCalculatorFn<TParameter, any, TValue>
    ) {
        super();
    }

    get isParameterized(): true {
        return true;
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
        readonly sourceModel: () => AnyModel,
        readonly sourceKeyPropName: string | undefined,
        readonly fn: TargetCalculatorFn<any, TTargetModel>
    ) {
        super();
    }

    get isParameterized(): false {
        return false;
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
        readonly sourceModel: () => AnyModel,
        readonly sourceKeyPropName: string | undefined,
        readonly fn: ParameterizedTargetCalculatorFn<TParameter, any, TTargetModel>
    ) {
        super();
    }

    get isParameterized(): true {
        return true;
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
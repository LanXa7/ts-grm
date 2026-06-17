import { ArgumentError } from "@/error/common";
import { makeErr } from "@/error/util";
import { acceptsNullOrUndefined } from "@/impl/util";
import { StandardSchemaV1 } from "@standard-schema/spec";

export type ScalarKind = 
    "STR" 
    | "I8" | "I16" | "I32" | "I64" 
    | "F32" | "F64" | "NUM" 
    | "DATE"
    | "BOOL"
    | "BINARY";

export class ScalarType<T> {

    readonly _dummy: T | undefined = undefined;

    private constructor(
        readonly kind: ScalarKind,
        readonly length: number | undefined
    ) {}

    static BOOL = new ScalarType<boolean>("BOOL", undefined);

    static DATE = new ScalarType<Date>("DATE", undefined);

    static I8 = new ScalarType<number>("I8", undefined);

    static I16 = new ScalarType<number>("I16", undefined);

    static I32 = new ScalarType<number>("I32", undefined);

    static I64 = new ScalarType<number>("I64", undefined);

    static F32 = new ScalarType<number>("F32", undefined);

    static F64 = new ScalarType<number>("F64", undefined);

    static NUM = new ScalarType<number>("NUM", undefined);

    static str(length: number): ScalarType<string> {
        if (length < 1) {
            throw new ArgumentError("length cannot be less than 1");
        }
        return new ScalarType<string>("STR", length);
    }

    static text(): ScalarType<string> {
        return new ScalarType<string>("STR", undefined);
    }

    static binary(length: number): ScalarType<Uint8Array> {
        if (length < 1) {
            throw new ArgumentError("length cannot be less than 1");
        }
        return new ScalarType<Uint8Array>("BINARY", length);
    }

    static image(): ScalarType<Uint8Array> {
        return new ScalarType<Uint8Array>("BINARY", undefined);
    }

    toString(): string {
        if (this.length == null) {
            return this.kind;
        }
        return `${this.kind}(${this.length})`;
    }
}

export type ScalarTypeOf<T extends ScalarType<any>> =
    T extends ScalarType<infer ValueType>
        ? ValueType
        : never;

export class ScalarProvider<
    TValueType extends StandardSchemaV1, 
    TSqlType extends ScalarType<any>
> {
    private constructor(
        readonly valueType: TValueType,
        readonly sqlType: TSqlType,
        readonly toValue: (
            sqlValue: ScalarTypeOf<TSqlType>
        ) => StandardSchemaV1.InferOutput<TValueType>,
        readonly toSql: (
            value: StandardSchemaV1.InferOutput<TValueType>
        ) => ScalarTypeOf<TSqlType>
    ) {}

    static of<
        TValueType extends StandardSchemaV1, 
        TSqlType extends ScalarType<any>
    >(
        options: {
            readonly valueType: TValueType;
            readonly sqlType: TSqlType;
            readonly toValue: (
                sqlValue: ScalarTypeOf<TSqlType>
            ) => StandardSchemaV1.InferOutput<TValueType>;
            readonly toSql: (
                sqlValue: StandardSchemaV1.InferOutput<TValueType>
            ) => ScalarTypeOf<TSqlType>;
        }
    ): ScalarProvider<TValueType, TSqlType> {
        if (acceptsNullOrUndefined(options.valueType)) {
            throw new ArgumentError(`The valueType "${options.valueType}" cannot contain null or undefined`);
        }
        if (acceptsNullOrUndefined(options.sqlType)) {
            throw new ArgumentError(`The sqlType "${options.sqlType}" cannot contain null or undefined`);
        }
        return new ScalarProvider(options.valueType, options.sqlType, options.toValue, options.toSql);
    }
}

export function enumProvider<
    TValues extends ReadonlyArray<string>
>(
    ...values: TValues
): ScalarProvider<
    StandardSchemaV1<unknown, TValues[number]>, 
    ScalarType<string>
>;

export function enumProvider<
    TMap extends {readonly [key: string]: string}
>(
    map: TMap
): ScalarProvider<
    StandardSchemaV1<unknown, keyof TMap>, 
    ScalarType<string>
>;

export function enumProvider<
    TMap extends {readonly [key: string]: number}
>(
    map: TMap
): ScalarProvider<
    StandardSchemaV1<unknown, keyof TMap>, 
    ScalarType<number>
>;

export function enumProvider(
    ...args: ReadonlyArray<any>
): ScalarProvider<
    StandardSchemaV1<unknown, any>, 
    ScalarType<any>
> {
    if (typeof args[0] === "string") {
        if (args.length < 2) {
            throw new ArgumentError("The must be at least two enum values");
        }
        for (let i = 1; i < args.length; i++) {
            if (typeof args[i] !== "string") {
                throw new ArgumentError(`The enumValues[${i}] must be string`);
            }
        }
        const values = new Set<any>();
        let len = 0;
        for (const value of args) {
            if (values.has(value)) {
                throw new ArgumentError(`The value of enum map is not unique, duplicated value: "${value}"`);
            }
            values.add(value);
            len = Math.max(len, value.length);
        }
        return ScalarProvider.of({
            valueType: standardEnum(args as ReadonlyArray<string>),
            sqlType: ScalarType.str(len),
            toValue: _ => _,
            toSql: _ => _
        });
    }
    const enumOptions = args[0] as { readonly [key: string]: string | number };
    if (Object.keys(enumOptions).length < 2) {
        throw new ArgumentError("The must be at least two enum values");
    }
    let mergedValueType: "string" | "number" | undefined = undefined;
    const valueMap = new Map<string, any>();
    const keyMap = new Map<any, string>();
    for (const key in enumOptions) {
        if (typeof key !== "string") {
            throw new ArgumentError("The key of enum map key must be string");
        }
        const value = enumOptions[key];
        const valueType = typeof value;
        switch (valueType) {
            case "string":
            case "number":
                if (mergedValueType == null) {
                    mergedValueType = valueType;
                } else if (mergedValueType !== valueType) {
                    throw new ArgumentError("The values of enum map must be same");
                }
                valueMap.set(key, value);
                if (keyMap.has(value)) {
                    throw new ArgumentError(`The value of enum map is not unique, duplicated value: "${value}"`);
                }
                keyMap.set(value, key);
                break;
            default:
                throw new ArgumentError("The values of enum map must be string of number");
        }
    }
    let len = 0;
    if (mergedValueType === "string") {
        for (const key in enumOptions) {
            len = Math.max(len, (enumOptions[key] as string).length);
        }
    }
    return ScalarProvider.of({
        valueType: standardEnum(Object.keys(enumOptions)),
        sqlType: mergedValueType === "string" 
            ? ScalarType.str(len) 
            : ScalarType.I32,
        toValue: v => keyMap.get(v) 
            ?? makeErr(() => new ArgumentError(`Illegal sql value: ${v}`)),
        toSql: v => valueMap.get(v as any) 
            ?? makeErr(() => new ArgumentError(`Illegal ts value: ${v}`)) as number
    });
}

export function jsonProvider<
    TValueType extends StandardSchemaV1
>(
    valueType: TValueType
): ScalarProvider<
    TValueType, 
    ScalarType<string>
> {
    return ScalarProvider.of({
        valueType,
        sqlType: ScalarType.text(),
        toValue: v => JSON.parse(v),
        toSql: v => JSON.stringify(v)
    });
}

export function jsonbProvider<
    TValueType extends StandardSchemaV1
>(
    valueType: TValueType
): ScalarProvider<
    TValueType, 
    ScalarType<Uint8Array>
> {
    if (typeof Buffer !== "undefined") {
        return ScalarProvider.of({ // Node
            valueType,
            sqlType: ScalarType.image(),
            toValue: v => JSON.parse((v as Buffer).toString("utf-8")),
            toSql: v => {
                const str = JSON.stringify(v);
                const len = Buffer.byteLength(str, "utf-8");
                const buf = Buffer.allocUnsafe(len);
                buf.write(str, 0, len, "utf-8");
                return buf;
            }
        });    
    }
    return ScalarProvider.of({ // Deno, Bun
        valueType,
        sqlType: ScalarType.image(),
        toValue: v => JSON.parse(sharedDecoder.decode(v)),
        toSql: v => sharedEncoder.encode(JSON.stringify(v))
    });
}

const sharedEncoder = new TextEncoder();

const sharedDecoder = new TextDecoder("utf-8");

const standardEnum = <T extends string>(
    options: ReadonlyArray<T>
): StandardSchemaV1<unknown, T> => ({
    '~standard': {
        version: 1,
        vendor: 'custom',
        validate(value) {
        return typeof value === 'string' && options.includes(value as T)
            ? { value: value as T }
            : { issues: [{ message: `Expected one of ${options.join(', ')}` }] };
        },
    },
});

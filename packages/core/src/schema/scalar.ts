import { ArgumentError } from "@/error/common";
import { makeErr } from "@/error/util";
import { acceptsNullOrUndefined } from "@/impl/util";
import { StandardSchemaV1 } from "@standard-schema/spec";

export class ScalarProvider<
    TValueType extends StandardSchemaV1, 
    TSqlType extends StandardSchemaV1
> {
    private constructor(
        readonly valueType: TValueType,
        readonly sqlType: TSqlType,
        readonly toValue: (
            sqlValue: StandardSchemaV1.InferOutput<TSqlType>
        ) => StandardSchemaV1.InferOutput<TValueType>,
        readonly toSql: (
            value: StandardSchemaV1.InferOutput<TValueType>
        ) => StandardSchemaV1.InferOutput<TSqlType>
    ) {}

    static of(
        options: {
            readonly valueType: any;
            readonly sqlType: any;
            readonly toValue: (sqlValue: any) => StandardSchemaV1.InferOutput<any>;
            readonly toSql: (sqlValue: any) => StandardSchemaV1.InferOutput<any>;
        }
    ): ScalarProvider<any, any> {
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
    StandardSchemaV1<unknown, string>
>;

export function enumProvider<
    TMap extends {readonly [key: string]: string}
>(
    map: TMap
): ScalarProvider<
    StandardSchemaV1<unknown, keyof TMap>, 
    StandardSchemaV1<unknown, string>
>;

export function enumProvider<
    TMap extends {readonly [key: string]: number}
>(
    map: TMap
): ScalarProvider<
    StandardSchemaV1<unknown, keyof TMap>, 
    StandardSchemaV1<unknown, number>
>;

export function enumProvider(
    ...args: ReadonlyArray<any>
): ScalarProvider<
    StandardSchemaV1<unknown, any>, 
    StandardSchemaV1<unknown, any>
> {
    if (typeof args[0] === "string") {
        if (args.length < 2) {
            throw new ArgumentError("The must be at least two enum values");
        }
        for (let i = 1; i < args.length; i++) {
            if (typeof args[i] !== "string") {
                throw new ArgumentError(`The enumValues[%d] must be string`);
            }
        }
        const values = new Set<any>();
        for (const value of args) {
            if (values.has(value)) {
                throw new ArgumentError(`The value of enum map is not unique, duplicated value: "${value}"`);
            }
            values.add(value);
        }
        return ScalarProvider.of({
            valueType: standardEnum(args as ReadonlyArray<string>),
            sqlType: standardString(),
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
    return ScalarProvider.of({
        valueType: typeof args[0] === "string" 
            ? standardEnum(args as ReadonlyArray<string>) 
            : standardEnum(Object.keys(enumOptions)),
        sqlType: mergedValueType === "string" 
            ? standardString() 
            : standardNumber(),
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
    StandardSchemaV1<unknown, string>
> {
    return ScalarProvider.of({
        valueType,
        sqlType: standardString(),
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
    StandardSchemaV1<unknown, any>
> {
    if (typeof Buffer !== "undefined") {
        return ScalarProvider.of({ // Node
            valueType,
            sqlType: standardInstanceof(Buffer),
            toValue: v => JSON.parse(v.toString("utf-8")),
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
        sqlType: standardInstanceof(Uint8Array),
        toValue: v => JSON.parse(sharedDecoder.decode(v)),
        toSql: v => sharedEncoder.encode(JSON.stringify(v))
    });
}

const sharedEncoder = new TextEncoder();

const sharedDecoder = new TextDecoder("utf-8");

const standardString = (): StandardSchemaV1<unknown, string> => ({
    '~standard': {
        version: 1,
        vendor: 'custom',
        validate(value) {
        return typeof value === 'string' 
            ? { value } 
            : { issues: [{ message: 'Expected string' }] };
        },
    },
});

const standardNumber = (): StandardSchemaV1<unknown, number> => ({
    '~standard': {
        version: 1,
        vendor: 'custom',
        validate(value) {
        return typeof value === 'number' 
            ? { value } 
            : { issues: [{ message: 'Expected number' }] };
        },
    },
});

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

const standardInstanceof = <T extends abstract new (...args: any) => any>(
  expectedClass: T
): StandardSchemaV1<unknown, InstanceType<T>> => ({
    '~standard': {
        version: 1,
        vendor: 'custom',
        validate(value) {
        return value instanceof expectedClass
            ? { value: value as InstanceType<T> }
            : { issues: [{ message: `Expected an instance of ${expectedClass.name}` }] };
        },
    },
});

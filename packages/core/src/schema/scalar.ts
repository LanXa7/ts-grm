import { ArgumentError } from "@/error/common";
import { makeErr } from "@/error/util";
import { z } from "zod";

export class ScalarProvider<
    TValueType extends z.ZodType, 
    TSqlType extends z.ZodType
> {
    private constructor(
        readonly valueType: TValueType,
        readonly sqlType: TSqlType,
        readonly toValue: (
            sqlValue: z.infer<TSqlType>
        ) => z.infer<TValueType>,
        readonly toSql: (
            value: z.infer<TValueType>
        ) => z.infer<TSqlType>
    ) {}

    static of<
    TValueType extends z.ZodType, 
    TSqlType extends z.ZodType
>(
    options: {
        readonly valueType: TValueType;
        readonly sqlType: TSqlType;
        readonly toValue: (sqlValue: z.infer<TSqlType>) => z.infer<TValueType>;
        readonly toSql: (sqlValue: z.infer<TValueType>) => z.infer<TSqlType>;
    }
): ScalarProvider<TValueType, TSqlType> {
    if (options.valueType.safeParse(null).success 
        || options.valueType.safeParse(undefined).success) {
            throw new ArgumentError(`The valueType "${options.valueType}" cannot contain null or undefined`);
        }
        if (options.sqlType.safeParse(null).success 
        || options.sqlType.safeParse(undefined).success) {
            throw new ArgumentError(`The sqlType "${options.sqlType}" cannot contain null or undefined`);
        }
        return new ScalarProvider(options.valueType, options.sqlType, options.toValue, options.toSql);
    }
}

export function enumProvider<
    TValues extends ReadonlyArray<string>
>(
    ...values: TValues
): ScalarProvider<z.ZodEnum<z.util.ToEnum<TValues[number]>>, z.ZodString>;

export function enumProvider<
    TMap extends {readonly [key: string]: string}
>(
    map: TMap
): ScalarProvider<z.ZodEnum<TMap>, z.ZodString>;

export function enumProvider<
    TMap extends {readonly [key: string]: number}
>(
    map: TMap
): ScalarProvider<z.ZodEnum<TMap>, z.ZodNumber>;

export function enumProvider(
    ...args: ReadonlyArray<any>
): ScalarProvider<z.ZodEnum<any>, z.ZodType> {
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
            valueType: z.enum(args as ReadonlyArray<string>),
            sqlType: z.string(),
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
        valueType: typeof args[0] === "string" ? z.enum(args) : z.enum(enumOptions),
        sqlType: mergedValueType === "string" ? z.string() : z.number(),
        toValue: v => keyMap.get(v) 
            ?? makeErr(() => new ArgumentError(`Illegal sql value: ${v}`)),
        toSql: v => valueMap.get(v as any) 
            ?? makeErr(() => new ArgumentError(`Illegal ts value: ${v}`)) as number
    });
}

export function jsonProvider<
    TValueType extends z.ZodType
>(
    valueType: TValueType
): ScalarProvider<TValueType, z.ZodString> {
    return ScalarProvider.of({
        valueType,
        sqlType: z.string(),
        toValue: v => JSON.parse(v),
        toSql: v => JSON.stringify(v)
    });
}

export function jsonbProvider<
    TValueType extends z.ZodType
>(
    valueType: TValueType
): ScalarProvider<TValueType, z.ZodType> {
    if (typeof Buffer !== "undefined") {
        return ScalarProvider.of({ // Node
            valueType,
            sqlType: z.instanceof(Buffer),
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
        sqlType: z.instanceof(Uint8Array),
        toValue: v => JSON.parse(sharedDecoder.decode(v)),
        toSql: v => sharedEncoder.encode(JSON.stringify(v))
    });
}

const sharedEncoder = new TextEncoder();

const sharedDecoder = new TextDecoder("utf-8");
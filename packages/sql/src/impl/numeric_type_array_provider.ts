import { spi } from "@ts-grm/core";

export interface NumericTypeArrayProvider {
    readonly numericTypes: ReadonlyArray<spi.NumericType> | undefined;
}
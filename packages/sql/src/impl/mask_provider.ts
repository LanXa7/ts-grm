import { TypeMask } from "./data_row_reader";

export interface MaskProvider {
    readonly masks: ReadonlyArray<TypeMask> | undefined;
}
import { suppressUnused } from "@/index";
import { ViewArgsImpl } from ".";
import { ViewNullType } from "../dto";
import { AnyModel } from "../model";
import { NullityType } from "../prop_contract";

export type TypeWithNullity<
    T, 
    TNullity extends NullityType, 
    TViewNullType extends ViewNullType
> = 
    TNullity extends "NONNULL"
        ? T
        : TViewNullType extends "NULL"
            ? T | null
            : T | undefined;

export interface With<TArgs extends ViewArgsImpl<AnyModel, any>> {

    readonly __with: true;

    readonly __fnPtr: () => TArgs;
}

export function $<const TArgs extends ViewArgsImpl<AnyModel, any>>(
    args: TArgs
): With<TArgs> {
    suppressUnused(args);
    throw new Error("Implement later"); 
}

export type ActionKeys = ExplicitActionKeys | "$explicit";

export type ExplicitActionKeys = "$allScalars" | "$fold" | "$polymorphism" | "$recursive";

export type RestrictKeys<T, TKeys extends string | number | symbol> = {
    [K in keyof T]: K extends TKeys ? T[K] : never;
};
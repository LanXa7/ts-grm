import { spi } from "@ts-grm/core";

export type TargetRowMapData = {
    readonly getter: TargetRowMapGetter;
    map: Map<any, spi.DtoRow> | undefined;
};
export type TargetRowMapGetter = (keys: ReadonlyArray<any>) => Promise<Map<any, spi.DtoRow>>;

export type AssociationBinding = {
    readonly dependency: any;
    readonly sourceRows: Array<spi.DtoRow>;
    targetData: spi.DtoRow | ReadonlyArray<spi.DtoRow> | undefined;
    targetIdMap: Map<any, any> | undefined;
};

export type CalculatorBinding = {
    readonly dependency: any;
    readonly hash: any;
    readonly sourceRows: Array<spi.DtoRow>;
    targetData: any;
};
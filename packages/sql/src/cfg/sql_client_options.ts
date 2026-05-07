import { EntityManager, metadata } from "@ts-grm/core";
import { FilterManager } from "./filter";

export type SqlClientOptions = {
    
    readonly strategy: metadata.DatabaseNamingStrategy;

    readonly defaultBatchSize: number;

    readonly sqlLogger: SqlLogger;

    readonly filterManager: FilterManager;

    readonly entityManager: EntityManager | undefined;
};

export type SqlLogger = {

    readonly pretty: boolean;

    readonly parameter: SqlLoggerParameterType;
}

export type SqlLoggerParameterType = "PLACEHOLDER" | "COMMENT" | "INLINE";
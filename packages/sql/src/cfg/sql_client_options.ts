import { metadata } from "@ts-grm/core";

export type SqlClientOptions = {
    
    readonly strategy: metadata.DatabaseNamingStrategy;

    readonly defaultBatchSize: number;

    readonly sqlLogger: SqlLogger;
};

export type SqlLogger = {

    readonly pretty: boolean;

    readonly parameter: SqlLoggerParameterType;
}

export type SqlLoggerParameterType = "PLACEHOLDER" | "COMMENT" | "INLINE";
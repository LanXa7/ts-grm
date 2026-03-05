import { metadata } from "@ts-grm/core";

export type SqlClientOptions = {
    
    readonly databaseNamingStrategy: metadata.DatabaseNamingStrategy | undefined;

    readonly defaultBatchSize: number | number;
};
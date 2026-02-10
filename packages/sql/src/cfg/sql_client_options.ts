import { DatabaseNamingStrategy } from "./database_naming_strategy";

export type SqlClientOptions = {
    
    readonly databaseNamingStrategy: DatabaseNamingStrategy | undefined;

    readonly defaultBatchSize: number | number;
};
import { Purpose } from "@/transaction/executor";
import { dsl, FetchRangeOptions, RootQuery, RootQueryProjection, RootQuerySelection, spi } from "@ts-grm/core";
import { AsyncLocalStorage } from "node:async_hooks";
import { DataRowReader } from "../data_row_reader";
import { AtomRootQueryImpl } from "../atom_root_query_impl";
import { MergedRootQueryImpl } from "../merged_query";
import { buildStatement } from "./sql_gen";
import { readColumn, readColumnArray } from "./column_reader";

const explicitPurposeStorage = new AsyncLocalStorage<Purpose>();

export function usingExplicitPurpose<R>(
    purpose: Purpose, 
    fn: () => Promise<R>
): Promise<R> {
    return explicitPurposeStorage.run(purpose, fn);
}

export async function executeQuery<TProjection extends RootQueryProjection<any>>(
    query: RootQuery<TProjection>,
    options: ExecuteQueryOptions | undefined
): Promise<ReadonlyArray<any>> {
    const contract = query as any as spi.QueryContract;
    const sqlClient = contract.kind === "ATOM"
        ? (query as AtomRootQueryImpl<TProjection>).mutableQuery.sqlClient
        : (query as any as MergedRootQueryImpl<TProjection>).sqlClient;
    const [sql, args] = buildStatement(sqlClient, query, options);
    const transactionManager = sqlClient.driver.transactionManager;
    return transactionManager.executeReadonly(async () => {
        const dataRows = await sqlClient.executor.executeStatement(
            sql, 
            args, 
            explicitPurposeStorage.getStore() ?? { kind: "QUERY" }
        );
        const dataRowReader = DataRowReader.of(dataRows);
        switch (contract.projection.kind) {
            case "ROOT_SINGLE":
                return await readColumn(
                    sqlClient, 
                    options === "COUNT"
                        ? dsl.count() as RootQuerySelection<any>
                        : contract.projection.selection, 
                    dataRowReader
                );
            case "ROOT_ARRAY":
                return await readColumnArray(sqlClient, contract.projection.selections, dataRowReader);
            default:
                throw new Error();
        }
    });
}

export type ExecuteQueryOptions =
    "COUNT" | FetchRangeOptions;
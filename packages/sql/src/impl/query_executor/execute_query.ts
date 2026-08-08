import { Purpose } from "@/transaction/executor";
import { dsl, FetchRangeOptions, RootQuery, RootQueryProjection, RootQuerySelection, spi } from "@ts-grm/core";
import { AsyncLocalStorage } from "node:async_hooks";
import { DataRowReader } from "../data_row_reader";
import { AtomRootQueryImpl } from "../atom_root_query_impl";
import { MergedRootQueryImpl } from "../merged_query";
import { buildStatement } from "./sql_gen";
import { readColumn, readColumnArray, readColumnMap } from "./column_reader";
import { IllegalPaginationError } from "@/error/illegal_pagination";

const explicitPurposeStorage = new AsyncLocalStorage<Purpose>();

export function usingExplicitPurpose<R>(
    purpose: Purpose, 
    fn: () => Promise<R>
): Promise<R> {
    return explicitPurposeStorage.run(purpose, fn);
}

export async function executeQuery<TProjection extends RootQueryProjection<any>>(
    query: RootQuery<TProjection>,
    nullAsUndefined: boolean,
    options: ExecuteQueryOptions | undefined
): Promise<ReadonlyArray<any>> {
    const contract = query as any as spi.QueryContract;
    validateFetchType(contract, options);
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
                    nullAsUndefined,
                    dataRowReader
                );
            case "ROOT_ARRAY":
                return await readColumnArray(
                    sqlClient, 
                    contract.projection.selections, 
                    nullAsUndefined,
                    dataRowReader
                );
            case "ROOT_MAP":
                return await readColumnMap(sqlClient, contract.projection.selections, nullAsUndefined, dataRowReader);
            default:
                throw new Error();
        }
    });
}

export type ExecuteQueryOptions =
    "COUNT" | FetchRangeOptions;

function validateFetchType(
    query: spi.QueryContract,
    options: ExecuteQueryOptions | undefined
) {
    if (options == null || typeof options === "string") {
        return;
    }
    if (options.offset == null || options.offset === 0) {
        return;
    }
    switch (query.projection.kind) {
        case "ROOT_SINGLE":
            validateFetchTypeImpl(query.projection.selection);
            break;
        case "ROOT_ARRAY":
            for (const selection of query.projection.selections) {
                validateFetchTypeImpl(selection);
            }
            break;
        case "ROOT_MAP":
            for (const key in query.projection.selections) {
                validateFetchTypeImpl(query.projection.selections[key]!);
            }
            break;
    }
}

function validateFetchTypeImpl(
    selection: RootQuerySelection<any>
) {
    if (selection instanceof spi.FetchedViewImpl) {
        const joinFetchFields = selection.view.mapper.joinFetchFields;
        if (joinFetchFields.length !== 0) {
            throw new IllegalPaginationError(joinFetchFields);
        }
    }
}
import { ast, metadata, RootQuery, RootQueryProjection } from "@ts-grm/core";
import { MergedRootQueryImpl } from "./merged_query";
import { AtomRootQueryImpl } from "./atom_root_query_impl";
import { Composite } from "@/sql/fragment";
import { SqlBuilder } from "@/sql/sql_builder";
import { DataRowReader } from "./data_row_reader";

export async function executeQuery<TProjection extends RootQueryProjection<any>>(
    q: RootQuery<TProjection>
): Promise<ReadonlyArray<any>> {
    const contract = q as any as ast.QueryContract;
    const sqlClient = contract.kind === "ATOM"
        ? (q as AtomRootQueryImpl<TProjection>).mutableQuery.sqlClient
        : (q as MergedRootQueryImpl<TProjection>).sqlClient;
    const composite = Composite.of(q, sqlClient, undefined);
    const builder = SqlBuilder.of(sqlClient);
    composite.into(builder);
    const [sql, argumentMap] = builder.build();
    const args = Array.from(argumentMap.values());
    const transactionManager = sqlClient.driver.transactionManager;
    return transactionManager.executeReadonly(async () => {
        const dataRows = await sqlClient.executor.executeStatement(sql, args);
        const dataRowReader = new DataRowReader(dataRows, 0);
        switch (contract.projection.kind) {
            case "ROOT_SINGLE":
                const selection = contract.projection.selection;
                if (selection instanceof metadata.FetchedViewImpl) {
                    return readDto(dataRowReader, selection);
                }
                throw new Error();
            default:
                throw new Error();
        }
    });
}

function readDto(
    dataRowReader: DataRowReader, 
    fetchedView: metadata.FetchedViewImpl<any, any>
): ReadonlyArray<any> {
    const dtoRows: Array<metadata.DtoRow> = [];
    const dtos: Array<any> = [];
    const dtoRowReader = fetchedView.view.mapper.dtoRowReader;
    while (dataRowReader.next()) {
        const dtoRow = dtoRowReader.read(undefined, dataRowReader);
        dtoRows.push(dtoRow);
        dtos.push(dtoRow.dto);
    }
    const unresolvedFields = fetchedView.view.mapper.unresolvedFields;
    for (const unresolvedField of unresolvedFields) {
        if (unresolvedField.prop.associationType != null) {
            console.log(unresolvedField.prop.toString());
            for (const dtoRow of dtoRows) {
                console.log(dtoRowReader.dependency(unresolvedField.index, dtoRow));
            }
        }
    }
    return dtos;
}

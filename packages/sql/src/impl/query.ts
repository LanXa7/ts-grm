import { ast, metadata, RootQuery, RootQueryProjection } from "@ts-grm/core";
import { MergedRootQueryImpl } from "./merged_query";
import { AtomRootQueryImpl } from "./atom_root_query_impl";
import { Composite } from "@/sql/fragment";
import { SqlBuilder } from "@/sql/sql_builder";
import { DataRowReader } from "./data_row_reader";

export async function query<TProjection extends RootQueryProjection<any>>(
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
                const dtoRows: Array<metadata.DtoRow> = [];
                if (selection instanceof metadata.FetchedViewImpl) {
                    const dtoRowReader = selection.view.mapper.rowReader;
                    while (dataRowReader.next()) {
                        const dtoRow = dtoRowReader.read(undefined, dataRowReader);
                        dtoRows.push(dtoRow);
                    }
                }
                return dtoRows;
            default:
                throw new Error();
        }
    });
}

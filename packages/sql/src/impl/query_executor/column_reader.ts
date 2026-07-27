import { SqlClientImplementor } from "@/sql_client";
import { RootQuerySelection, spi } from "@ts-grm/core";
import { DataRowReader } from "../data_row_reader";
import { resolveAssociations } from "./association_resolver";
import { resolveCalculators, resolveTsFormulas } from "./calculator_resolver";
import { LambdaJoinFetchVisitor } from "./join_fetch_visitor";

export async function readColumn(
    sqlClient: SqlClientImplementor,
    selection: RootQuerySelection<any>,
    dataRowReader: DataRowReader,
): Promise<ReadonlyArray<any>> {
    if (selection instanceof spi.FetchedViewImpl) {
        return await readDtos(sqlClient, selection.view.mapper, dataRowReader);
    }
    const values = [];
    while (dataRowReader.next()) {
        values.push(dataRowReader.get(0));
    }
    return values;
}

export async function readColumnArray(
    sqlClient: SqlClientImplementor,
    selections: ReadonlyArray<RootQuerySelection<any>>,
    dataRowReader: DataRowReader
): Promise<ReadonlyArray<any>> {
    const columns: Array<ReadonlyArray<any>> = [];
    for (let i = 0; i < selections.length; i++) {
        dataRowReader.reset();
        const selection = selections[i]!;
        const columnValues = await readColumn(sqlClient, selection, dataRowReader);
        if (columnValues.length === 0) {
            return [];
        }
        if (selection instanceof spi.FetchedViewImpl) {
            dataRowReader = dataRowReader.offset(selection.view.mapper.span);
        } else {
            dataRowReader = dataRowReader.offset(1);
        }
        columns[i] = columnValues;
    }
    const rowCount = columns[0]!.length;
    const rows: Array<Array<any>> = [];
    for (let r = 0; r < rowCount; r++) {
        const row = [];
        for (let c = 0; c < selections.length; c++) {
            row[c] = columns[c]![r];
        }
        rows.push(row);
    }
    return rows;
}

async function readDtos(
    sqlClient: SqlClientImplementor,
    mapper: spi.DtoMapper,
    dataRowReader: DataRowReader
): Promise<ReadonlyArray<any>> {
    const dtoRows: Array<spi.DtoRow> = [];
    const dtos: Array<any> = [];
    const dtoRowReader = mapper.dtoRowReader;
    const jfFieldMap = joinFetchFieldMap(sqlClient, mapper);
    const joinFetchExecutor = new JoinFetchExecutor(jfFieldMap);
    const joinFetchReader = dataRowReader.offset(mapper.span);
    while (dataRowReader.next()) {
        const dtoRow = dtoRowReader.read(undefined, dataRowReader);
        dtoRows.push(dtoRow);
        dtos.push(dtoRow.dto);
        joinFetchExecutor.execute(dtoRow, joinFetchReader);
    }
    if (dtoRows.length !== 0) {
        await resolveAssociations(sqlClient, mapper, jfFieldMap, dtoRows, undefined);
        resolveTsFormulas(mapper, dtoRows);
        await resolveCalculators(sqlClient, mapper, dtoRows);
    }
    return dtos;
}

function joinFetchFieldMap(
    sqlClient: SqlClientImplementor,
    mapper: spi.DtoMapper
) {
    const joinFetchFields = new Map<spi.DtoMapperField, number>();
    const joinFetchVisitor = new LambdaJoinFetchVisitor(sqlClient, {
        enter: (field, depth) => {
            joinFetchFields.set(field, depth);
            return undefined;
        },
        leave: (_field, _depth, _enterValue) => {}
    });
    joinFetchVisitor.visit(mapper);
    return joinFetchFields;
}

class JoinFetchExecutor {

    constructor(
        private readonly _joinFetchFields: Map<spi.DtoMapperField, number>
    ) {}

    execute(parent: spi.DtoRow, dataRowReader: DataRowReader) {
        if (parent.dto == null) {
            return;
        }
        for (const [field, depth] of this._joinFetchFields.entries()) {
            if (depth === 0) {
                this._execute(field, parent, dataRowReader);
            }
        }
    }

    private _execute(
        field: spi.DtoMapperField, 
        parent: spi.DtoRow,
        dataRowReader: DataRowReader
    ): DataRowReader {
        const dtoRow = field.subMapper!.dtoRowReader.read(
            [parent], 
            dataRowReader
        );
        parent.reader.resolve(field.index, parent, dtoRow.dto);
        const nextDataRowReader = dataRowReader.offset(field.subMapper!.span);
        let deeperDataRowReader = nextDataRowReader;
        for (const subField of field.subMapper!.fields) {
            if (!this._joinFetchFields.has(subField)) {    
                continue;
            }
            deeperDataRowReader = this._execute(
                subField, 
                dtoRow, 
                deeperDataRowReader
            );
        }
        return nextDataRowReader;
    }
}

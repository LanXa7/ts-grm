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

export async function readColumnMap(
    sqlClient: SqlClientImplementor,
    selectionMap: { readonly [key: string]: RootQuerySelection<any> },
    dataRowReader: DataRowReader
): Promise<ReadonlyArray<any>> {
    const columns: {[key: string]: ReadonlyArray<any>} = {};
    for (const key in selectionMap) {
        dataRowReader.reset();
        const selection = selectionMap[key]!;
        const columnValues = await readColumn(sqlClient, selection, dataRowReader);
        if (columnValues.length === 0) {
            return [];
        }
        if (selection instanceof spi.FetchedViewImpl) {
            dataRowReader = dataRowReader.offset(selection.view.mapper.span);
        } else {
            dataRowReader = dataRowReader.offset(1);
        }
        columns[key] = columnValues;
    }
    const rowCount = columns[Object.keys(columns)[0]!]!.length;
    const rows: Array<object> = [];
    for (let r = 0; r < rowCount; r++) {
        const row: {[key: string]: any} = {};
        for (const key in selectionMap) {
            row[key] = columns[key]![r];
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
    const jfMap = joinFetchMap(sqlClient, mapper);
    const joinFetchExecutor = mapper.hasDirectJoinFetches
        ? new JoinFetchExecutor(jfMap)
        : undefined;
    const joinFetchReader = dataRowReader.offset(mapper.span);
    while (dataRowReader.next()) {
        const dtoRow = dtoRowReader.read(undefined, dataRowReader);
        dtoRows.push(dtoRow);
        dtos.push(dtoRow.dto);
        joinFetchExecutor?.execute(dtoRow, joinFetchReader);
    }
    if (dtoRows.length !== 0) {
        await resolveAssociations(sqlClient, mapper, jfMap, dtoRows, undefined);
        resolveTsFormulas(mapper, dtoRows);
        await resolveCalculators(sqlClient, mapper, dtoRows);
    }
    return dtos;
}

function joinFetchMap(
    sqlClient: SqlClientImplementor,
    mapper: spi.DtoMapper
): Map<spi.DtoMapperField, JoinFetchData> {
    const joinFetchFields = new Map<spi.DtoMapperField, JoinFetchData>();
    const joinFetchVisitor = new LambdaJoinFetchVisitor(sqlClient, {
        enter: (field, depth) => {
            joinFetchFields.set(field, { depth, dtoRows: []});
            return undefined;
        },
        leave: (_field, _depth, _enterValue) => {}
    });
    joinFetchVisitor.visit(mapper);
    return joinFetchFields;
}

class JoinFetchExecutor {

    constructor(
        private readonly _joinFetchMap: Map<spi.DtoMapperField, JoinFetchData>
    ) {}

    execute(parent: spi.DtoRow, dataRowReader: DataRowReader) {
        if (parent.dto == null) {
            return;
        }
        for (const [field, data] of this._joinFetchMap.entries()) {
            if (data.depth === 0) {
                this._execute(field, parent, dataRowReader);
            }
        }
    }

    private _execute(
        field: spi.DtoMapperField, 
        parent: spi.DtoRow,
        dataRowReader: DataRowReader
    ): DataRowReader {
        if (this._isNull(field, dataRowReader)) {
            return this._skip(field, dataRowReader);
        }
        const dtoRow = field.subMapper!.dtoRowReader.read(
            [parent], 
            dataRowReader
        );
        parent.reader.resolve(field.index, parent, dtoRow.dto);
        const data = this._joinFetchMap.get(field)!;
        data.dtoRows.push(dtoRow);
        const nextDataRowReader = dataRowReader.offset(field.subMapper!.span);
        let deeperDataRowReader = nextDataRowReader;
        for (const subField of field.subMapper!.fields) {
            if (!this._joinFetchMap.has(subField)) {    
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

    private _skip(
        field: spi.DtoMapperField, 
        dataRowReader: DataRowReader
    ): DataRowReader {
        const nextDataRowReader = dataRowReader.offset(field.subMapper!.span);
        let deeperDataRowReader = nextDataRowReader;
        for (const subField of field.subMapper!.fields) {
            if (!this._joinFetchMap.has(subField)) {    
                continue;
            }
            deeperDataRowReader = this._skip(
                subField, 
                deeperDataRowReader
            );
        }
        return nextDataRowReader;
    }

    private _isNull(
        field: spi.DtoMapperField, 
        dataRowReader: DataRowReader
    ) {
        const prop = field.prop.asEntityProp;
        if (prop != null && prop.nullable) {
            const firstNonNullField = field.subMapper!.fields.find(sf => sf.columnIndex != null && sf.prop.asEntityProp?.nullable === false);
            const index = firstNonNullField!.columnIndex!;
            return dataRowReader.get(index) == null;
        }
        return false;
    }
}

export interface JoinFetchData {

    readonly depth: number;

    readonly dtoRows: Array<spi.DtoRow>;
}
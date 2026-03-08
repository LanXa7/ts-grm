export class BaseQueryMetadata {

    private readonly _aliasMap = new Map<string, string>();

    private readonly _columnMap = new Map<string, string | Array<ExportedColumn>>();

    alias(
        exportedName: string, 
        columnName: string | undefined
    ): string {
        const key = `${exportedName}:${columnName ?? ""}`;
        let alias = this._aliasMap.get(key);
        if (alias != null) {
            return alias;
        }
        alias = `c${this._aliasMap.size + 1}`;
        if (columnName == null) {
            this._columnMap.set(exportedName, alias);
        } else {
            let exportedColumns = this._columnMap.get(exportedName);
            if (!Array.isArray(exportedColumns)) {
                exportedColumns = [];
                this._columnMap.set(exportedName, exportedColumns);
            }
            exportedColumns.push({columnName, alias});
        }
        this._aliasMap.set(key, alias);
        return alias;
    }

    exportedData(
        exportedName: string
    ): string | ReadonlyArray<ExportedColumn> | undefined {
        return this._columnMap.get(exportedName);
    }
}

export type ExportedColumn = {
    readonly columnName: string;
    readonly alias: string;
};
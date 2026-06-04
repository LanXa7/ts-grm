import { RealTable } from "./real_table";

export class BaseQueryMetadata {

    private readonly _aliasMap = new Map<string, string>();

    private readonly _selections: Array<ExportedSelection> = [];

    constructor(
        readonly isCte: boolean,
        readonly realTable: RealTable
    ) {}

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
        this._aliasMap.set(key, alias);
        this._selections.push({
            exportedName,
            columnName,
            alias
        });
        return alias;
    }

    get selections(): ReadonlyArray<ExportedSelection> {
        return this._selections;
    }
}

export type ExportedSelection = {
    readonly exportedName: string;
    readonly columnName: string | undefined;
    readonly alias: string;
}

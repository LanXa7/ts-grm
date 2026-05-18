import { err, metadata } from "@ts-grm/core";

export class DataRowReader implements metadata.DataReader {

    private _rowIndex = -1;

    constructor(
        private readonly _rows: DataRows,
        private readonly _offset: number
    ) {}

    next(): boolean {
        if (this._rowIndex + 1 >= this._rows.length) {
            return false;
        }
        this._rowIndex++;
        return true;
    }

    reset() {
        this._rowIndex = -1;
    }

    get(col: number): any {
        const rowIndex = this._rowIndex;
        if (rowIndex < 0 || rowIndex >= this._rows.length) {
            throw new err.StateError("Illegal row index");
        }
        const row = this._rows[rowIndex]!;
        const colIndex = this._offset + col;
        if (colIndex < 0 || colIndex >= row.length) {
            throw new err.ArgumentError("Illegal col index");
        }
        return row[colIndex];
    }

    offset(offset: number): DataRowReader {
        if (offset === 0) {
            return this;
        }
        return new DataRowReader(this._rows, this._offset + offset);
    }

    get rowIndex(): number {
        return this._rowIndex;
    }
}

export type DataRow = ReadonlyArray<any>;
export type DataRows = ReadonlyArray<DataRow>;
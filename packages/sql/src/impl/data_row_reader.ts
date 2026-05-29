import { err, metadata } from "@ts-grm/core";

export class DataRowReader implements metadata.DataReader {

    private _rowIndex: RowIndex;

    private constructor(
        parent: DataRowReader | undefined,
        private readonly _rows: DataRows,
        private readonly _offset: number
    ) {
        this._rowIndex = parent?._rowIndex ?? new RowIndex();
    }

    static of(rows: DataRows): DataRowReader {
        return new DataRowReader(undefined, rows, 0);
    }

    next(): boolean {
        if (this._rowIndex.current + 1 >= this._rows.length) {
            return false;
        }
        this._rowIndex.next;
        return true;
    }

    get(col: number, width?: number): any {
        const rowIndex = this.rowIndex;
        if (rowIndex < 0 || rowIndex >= this._rows.length) {
            throw new err.StateError("Illegal row index");
        }
        const row = this._rows[rowIndex]!;
        const colIndex = this._offset + col;
        if (colIndex < 0 || colIndex >= row.length) {
            throw new err.ArgumentError("Illegal col index");
        }
        const span = width ?? 1;
        if (span < 1) {
            throw new err.ArgumentError(`with cannot be less than 1`);
        }
        if (colIndex < 0 || colIndex + span > row.length) {
            throw new err.ArgumentError("Illegal width");
        }
        if (span === 1) {
            return row[colIndex];
        }
        return row.slice(colIndex, colIndex + span);
    }

    offset(offset: number): DataRowReader {
        if (offset === 0) {
            return this;
        }
        return new DataRowReader(this, this._rows, this._offset + offset);
    }

    get rowIndex(): number {
        return this._rowIndex.current;
    }

    reset() {
        this._rowIndex.reset();
    }
}

export type DataRow = ReadonlyArray<any>;
export type DataRows = ReadonlyArray<DataRow>;

class RowIndex {

    private _val = -1;

    get next(): number {
        return ++this._val;
    }

    get current(): number {
        return this._val;
    }

    reset() {
        this._val = -1;
    }
}
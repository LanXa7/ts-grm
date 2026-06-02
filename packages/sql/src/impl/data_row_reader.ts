import { err, metadata } from "@ts-grm/core";

export class DataRowReader implements metadata.DataReader {

    private readonly _rows: DataRows;

    private readonly _rowIndex: RowIndex;

    protected constructor(
        data: DataRowReader | DataRows
    ) {
        if (data instanceof DataRowReader) {
            this._rows = data._rows;
            this._rowIndex = data._rowIndex;
        } else {
            this._rows = data;
            this._rowIndex = new RowIndex();
        }
    }

    static of(rows: DataRows): DataRowReader {
        return new DataRowReader(rows);
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
        const colIndex = this.translateCol(col);
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
        return new OffsetDataReader(this, offset);
    }

    mapColIndices(indices: ReadonlyArray<number> | undefined): DataRowReader {
        if (indices == null) {
            return this;
        }
        return new ColIndexMappedDataReader(this, indices);
    }

    get rowIndex(): number {
        return this._rowIndex.current;
    }

    reset() {
        this._rowIndex.reset();
    }

    protected translateCol(col: number): number {
        return col;
    }
}

class OffsetDataReader extends DataRowReader {

    constructor(
        parent: DataRowReader,
        private readonly _offset: number
    ) {
        super(parent);
    }

    protected translateCol(col: number): number {
        return this._offset + col;
    }

    offset(offset: number): DataRowReader {
        if (offset == 0) {
            return this;
        }
        return new OffsetDataReader(this, this._offset + offset);
    }
}

class ColIndexMappedDataReader extends DataRowReader {

    constructor(
        parent: DataRowReader,
        private readonly _indices: ReadonlyArray<number>
    ) {
        super(parent);
    }

    protected translateCol(col: number): number {
        return this._indices[col]!;
    }

    mapColIndices(
        indices: ReadonlyArray<number> | undefined
    ): DataRowReader {
        if (indices == null) {
            return this;
        }
        const newIndicies = indices.map(i => this.translateCol(i));
        return new ColIndexMappedDataReader(this, newIndicies);
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
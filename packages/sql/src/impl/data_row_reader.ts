import { err, spi } from "@ts-grm/core";

export class DataRowReader implements spi.DataReader {

    private readonly _rows: DataRows;

    private readonly _rowIndex: RowIndex;

    protected readonly _masks: ReadonlyArray<TypeMask> | undefined

    protected constructor(
        data: DataRowReader | DataRows,
        masks: ReadonlyArray<TypeMask> | undefined
    ) {
        if (data instanceof DataRowReader) {
            this._rows = data._rows;
            this._rowIndex = data._rowIndex;
        } else {
            this._rows = data;
            this._rowIndex = new RowIndex();
        }
        if (masks != null && masks.length !== 0) {
            this._masks = masks;
        } else {
            this._masks = undefined;
        }
    }

    static of(rows: DataRows, masks: ReadonlyArray<TypeMask> | undefined): DataRowReader {
        return new DataRowReader(rows, masks);
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
        const masks = this._masks;
        if (span === 1) {
            const mask = masks != null 
                ? masks[colIndex]
                : undefined;
            const value = row[colIndex];
            if (mask === TypeMask.NUM && typeof value === "string") {
                return parseInt(value);
            }
            if (mask === TypeMask.STR && typeof value === "number") {
                return value.toString();
            }
            return value;
        }
        if (masks == null) {
            return row.slice(colIndex, colIndex + span);
        }
        const values: Array<any> = [];
        const max = colIndex + span;
        for (let i = colIndex; i < max; i++) {
            const mask = masks[i];
            const value = row[i];
            if (mask === TypeMask.NUM && typeof value === "string") {
                values.push(parseInt(value));
            } else if (mask === TypeMask.STR && typeof value === "number") {
                values.push(value.toString());
            } else {
                values.push(value);
            }
        }
        return values;
    }

    offset(offset: number): DataRowReader {
        if (offset === 0) {
            return this;
        }
        return new OffsetDataReader(this, this._masks, offset);
    }

    mapColIndices(indices: ReadonlyArray<number> | undefined): DataRowReader {
        if (indices == null) {
            return this;
        }
        return new ColIndexMappedDataReader(this, this._masks, indices);
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

export enum TypeMask {
    NONE = 0,
    NUM = 1,
    STR = 2
};

class OffsetDataReader extends DataRowReader {

    constructor(
        parent: DataRowReader,
        masks: ReadonlyArray<TypeMask> | undefined,
        private readonly _offset: number
    ) {
        super(parent, masks);
    }

    protected override translateCol(col: number): number {
        return this._offset + col;
    }

    override offset(offset: number): DataRowReader {
        if (offset == 0) {
            return this;
        }
        return new OffsetDataReader(this, this._masks, this._offset + offset);
    }
}

class ColIndexMappedDataReader extends DataRowReader {

    constructor(
        parent: DataRowReader,
        masks: ReadonlyArray<TypeMask> | undefined,
        private readonly _indices: ReadonlyArray<number>
    ) {
        super(parent, masks);
    }

    protected override translateCol(col: number): number {
        return this._indices[col]!;
    }

    override offset(_: number): DataRowReader {
        throw new Error("Unsupported operation error");
    }

    override mapColIndices(
        indices: ReadonlyArray<number> | undefined
    ): DataRowReader {
        if (indices == null) {
            return this;
        }
        const newIndicies = indices.map(i => this.translateCol(i));
        return new ColIndexMappedDataReader(this, this._masks, newIndicies);
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
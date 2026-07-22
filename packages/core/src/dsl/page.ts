export type FetchRangeOptions = {
    readonly limit: number;
    readonly offset?: number | undefined;
};

export type FetchPageOptions = {
    readonly pageNo?: number | undefined;
    readonly pageSize: number;
};

export type Page<T> = {
    readonly totalRowCount: number;
    readonly totalPageCount: number;
    readonly pageNo: number;
    readonly isFirstPage: boolean;
    readonly isLastPage: boolean;
    readonly rows: ReadonlyArray<T>;
};
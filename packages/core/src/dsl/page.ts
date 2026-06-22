export type FetchRangeOptions = {
    readonly limit: number;
    readonly offset?: number;
};

export type FetchPageOptions = {
    
    /** The page number starts from 1, 
     * it cannot be specified when pageIndex is specified.
     */
    readonly pageNo?: number;

    /** The page number starts from 0, 
     * it cannot be specified when pageNo is specified.
     */
    readonly pageIndex?: number;

    readonly pageSize: number;
};

export type Page<T> = {
    readonly totalRowCount: number;
    readonly totalPageCount: number;
    readonly pageNo: number;
    readonly pageIndex: number;
    readonly isFirstPage: boolean;
    readonly isLastPage: boolean;
    readonly rows: ReadonlyArray<T>;
};
export type QueryOptions = {
    distinct: boolean;
    limit: number;
    offset: number;
}

export const defaultQueryOptions: QueryOptions = {
    distinct: false,
    limit: -1,
    offset: 0
};
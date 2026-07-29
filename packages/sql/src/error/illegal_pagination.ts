import { err, spi } from "@ts-grm/core";

export class IllegalPaginationError extends err.GrmError {

    constructor(joinFetchFields: ReadonlyArray<spi.DtoMapperField>) {
        super(
            `Unable to execute pagination query: the selected DTOs contain association properties ` +
            `with fetchType "JOIN_UNPAGED_ONLY" (${joinFetchFields.map(jff => jff.prop.toString()).join(", ")}), ` +
            `which are not supported in paginated queries.`
        );
    }
}
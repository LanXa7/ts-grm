import { err } from "@ts-grm/core";

export class IllegalPaginationError extends err.GrmError {

    constructor() {
        super(
            "Unable to execute pagination query. A column returned by the current query is DTOs, " +
            `and the DTO contain associated properties with fetchType is "JOIN_UNPAGED_ONLY"`
        );
    }
}
import { err } from "@ts-grm/core";

export class NoDataError extends err.GrmError {

    constructor(message: string) {
        super(message);
    }
}

export class TooManyDataError extends err.GrmError {

    constructor(message: string) {
        super(message);
    }
}
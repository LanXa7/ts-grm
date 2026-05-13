import { err } from "@ts-grm/core";

export class TimeoutError extends err.GrmError {

    constructor(
        readonly timeout: number
    ) {
        super(`The transaction has not been done during ${timeout} milliseconds`);
    }
}
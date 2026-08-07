import { err } from "@ts-grm/core";

export class MetadataError extends err.GrmError {

    constructor(message: string) {
        super(message);
    }
}

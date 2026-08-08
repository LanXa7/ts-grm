import { err } from "@ts-grm/core";

export class UnsupportedFeatureError extends err.GrmError {

    constructor(message: string) {
        super(message);
    }
}
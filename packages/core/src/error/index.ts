import { ArgumentError, StateError } from "./common";
import { GrmError } from "./grm_error";
import { ModelError, PropError } from "./metadata_error";

export const err = {
    ArgumentError,
    StateError,
    GrmError,
    ModelError,
    PropError
} as const;
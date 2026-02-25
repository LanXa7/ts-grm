import { ArgumentError, StateError } from "./common";
import { GrmError } from "./grm_error";
import { ModelError, PropError } from "./metadata_error";
import { makeErr } from "./util";

export const err = {
    ArgumentError,
    StateError,
    GrmError,
    ModelError,
    PropError,
    makeErr,
} as const;
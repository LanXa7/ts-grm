import { NoDataError, TooManyDataError } from "./data_error";
import { TimeoutError } from "./transaction_error";

export const sqlerr = {
    NoDataError,
    TooManyDataError,
    TimeoutError
} as const;
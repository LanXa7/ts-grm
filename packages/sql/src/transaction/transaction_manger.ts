import { TransactionOptions } from "@ts-grm/core";

export interface TransactionManager {

    execute<R>(
        options: TransactionOptions,
        fn: () => Promise<R>
    ): Promise<R>;
}
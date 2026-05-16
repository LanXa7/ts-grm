import { TransactionOptions } from "@ts-grm/core";
import { Executor } from "./executor";

export interface TransactionManager {

    execute<R>(
        options: TransactionOptions,
        fn: () => Promise<R>
    ): Promise<R>;

    executeReadonly<R>(
        fn: () => Promise<R>
    ): Promise<R>;

    readonly defaultExecutor: Executor;
}
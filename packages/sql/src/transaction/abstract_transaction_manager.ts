import { sqlerr } from "@/error";
import { err, Isolation, Propagation, TransactionOptions } from "@ts-grm/core";
import { AsyncLocalStorage } from "async_hooks";
import { TransactionManager } from "./transaction_manger";

export abstract class AbstractTransactionManager<TContext extends TransactionContext<TContext>> 
implements TransactionManager {

    async execute<R>(
        options: TransactionOptions,
        fn: () => Promise<R>
    ): Promise<R> {
        if (!this.isPropgationSupported(options.propagation)) {
            throw new err.ArgumentError(
                `The propagation "${options.propagation}" is not supported by current database`
            );
        }
        if (!this.isIsolationSupported(options.isolation)) {
            throw new err.ArgumentError(
                `The isolation "${options.isolation}" is not supported by current database`
            );
        }
        const ctx = transactionStorage.getStore() as TContext | undefined;
        switch (options.propagation) {
            case "REQUIRED":
                if (ctx?.isolation != null) {
                    await this.validateIsolation(ctx.isolation, options.isolation);
                    return await executeInTimeout(options.timeout, fn);
                }
                return await this.executeInNewContext(options.isolation, options.timeout, undefined, fn);
            case "REQUIRES_NEW":
                return await this.executeInNewContext(options.isolation, options.timeout, undefined, fn);
            case "NOT_SUPPORTED":
                if (ctx != null && ctx.isolation == null) {
                    return await executeInTimeout(options.timeout, fn);
                }
                return await this.executeInNewContext(undefined, options.timeout, undefined, fn);
            case "MANDATORY":
                if (ctx?.isolation == null) {
                    throw new err.ArgumentError(`There is no existing transaction`);
                }
                await this.validateIsolation(ctx.isolation, options.isolation);
                return await executeInTimeout(options.timeout, fn);
            case "NEVER":
                if (ctx?.isolation != null) {
                    throw new err.ArgumentError(`There is existing transaction`);
                }
                if (ctx != null) {
                    return await executeInTimeout(options.timeout, fn);
                }
                return await this.executeInNewContext(undefined, options.timeout, undefined, fn);
            case "NESTED":
                if (ctx?.isolation == null) {
                    return await this.executeInNewContext(options.isolation, options.timeout, undefined, fn);
                }
                return await this.executeInNewContext(options.isolation, options.timeout, ctx, fn);
        }
    }

    private async executeInNewContext<R>(
        isolation: Isolation | undefined,
        timeout: number,
        prevForSavepoint: TContext | undefined,
        fn: () => Promise<R>
    ): Promise<R> {
        const ctx = this.create(isolation, timeout, prevForSavepoint);
        if (prevForSavepoint) {
            return transactionStorage.run(ctx, async () => {
                let result: R;
                await this.begin(ctx);
                try {
                    result = await executeInTimeout(timeout, fn);
                } catch (ex) {
                    await this.rollback(ctx);
                    throw ex;
                }
                await this.commit(ctx);
                return result;
            });
        }
        if (isolation == null) {
            return transactionStorage.run(ctx, async () => {
                await this.open(ctx);
                try {
                    return await executeInTimeout(timeout, fn);
                } finally {
                    await this.close(ctx);
                }
            });
        }
        return transactionStorage.run(ctx, async () => {
            let result: R;
            await this.open(ctx);
            try {
                await this.begin(ctx);
                try {
                    result = await executeInTimeout(timeout, fn);
                } catch (ex) {
                    await this.rollback(ctx);
                    throw ex;
                }
                await this.commit(ctx);
            } finally {
                await this.close(ctx);
            }
            return result;
        });
    }

    private async validateIsolation(
        oldValue: Isolation,
        newValue: Isolation
    ): Promise<void> {
        if (isolationLevel(oldValue) >= isolationLevel(newValue)) {
            return;
        }
        try {
            await this.upgrade(newValue);
        } catch (ex) {
            if (ex instanceof err.StateError) {
                throw new err.ArgumentError(
                    `Cannot join existing transaction: ` +
                    `requested isolation ${newValue} is stricter than ` +
                    `current ${oldValue}`
                );
            }
            throw ex;
        }
    }

    protected isPropgationSupported(
        _: Propagation
    ): boolean {
        return true;
    }

    protected isIsolationSupported(
        _: Isolation
    ) {
        return true;
    }

    protected abstract create(
        isolation: Isolation | undefined, 
        timeout: number,
        prevForSavepoint: TContext | undefined
    ): TContext

    protected abstract open(ctx: TContext): Promise<void>;

    protected abstract close(ctx: TContext): Promise<void>;

    protected abstract begin(ctx: TContext): Promise<void>;

    protected abstract commit(ctx: TContext): Promise<void>;

    protected abstract rollback(ctx: TContext): Promise<void>;

    protected upgrade(_: Isolation): Promise<void> {
        throw new err.StateError(`The "uprade" has not been implemented`);
    }
}

export class TransactionContext<TContext extends TransactionContext<TContext>> {
    constructor(
        readonly isolation: Isolation | undefined, // Undefined means no transaction
        readonly timeout: number,
        readonly prevForSavepoint: TContext | undefined
    ) {
    }
}

const transactionStorage = new AsyncLocalStorage<TransactionContext<any>>();

async function executeInTimeout<R>(
    timeout: number,
    fn: () => Promise<R>
): Promise<R> {
    if (timeout <= 0) {
        return fn();
    }
    return new Promise<R>((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new sqlerr.TimeoutError(timeout));
        }, timeout);
        fn().then(
            result => { clearTimeout(timer); resolve(result); },
            error  => { clearTimeout(timer); reject(error); }
        );
    });
}

function isolationLevel(isolation: Isolation): number {
    switch (isolation) {
        case "READ_UNCOMMITTED":
            return 0;
        case "READ_COMMITTED":
            return 1;
        case "REPEATABLE_READ":
            return 2;
        case "SERIALIZABLE":
            return 3;
    }
}
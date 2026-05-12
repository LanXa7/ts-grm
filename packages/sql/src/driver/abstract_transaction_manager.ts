import { err, Isolation, Propagation, TransactionOptions } from "@ts-grm/core";
import { AsyncLocalStorage } from "async_hooks";

export abstract class AbstractTransactionManager<TContext extends TransactionContext> {

    abstract get name(): string;

    async execute<R>(
        options: TransactionOptions,
        fn: () => Promise<R>
    ): Promise<R> {
        if (!this.isPropgationSupported(options.propagation)) {
            throw new err.ArgumentError(
                `The propagation "${options.propagation}" is not supported by "${this.name}"`
            );
        }
        if (!this.isIsolationSupported(options.isolation)) {
            throw new err.ArgumentError(
                `The isolation "${options.isolation}" is not supported by "${this.name}"`
            );
        }
        const ctx = transactionStorage.getStore() as TContext | undefined;
        switch (options.propagation) {
            case "REQUIRED":
                if (ctx?.isolation != null) {
                    validateIsolation(ctx.isolation, options.isolation);
                    return await fn();
                }
                return await this.executeInNewContext(options.isolation, options.timeout, undefined, fn);
            case "REQUIRES_NEW":
                return await this.executeInNewContext(options.isolation, options.timeout, undefined, fn);
            case "NOT_SUPPORTED":
                if (ctx != null && ctx.isolation == null) {
                    return await fn();
                }
                return await this.executeInNewContext(undefined, options.timeout, undefined, fn);
            case "MANDATORY":
                if (ctx?.isolation == null) {
                    throw new err.ArgumentError(`There is no existing transaction`);
                }
                validateIsolation(ctx.isolation, options.isolation);
                return await fn();
            case "NEVER":
                if (ctx?.isolation != null) {
                    throw new err.ArgumentError(`There is existing transaction`);
                }
                if (ctx != null) {
                    return await fn();
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
                this.begin(ctx);
                try {
                    result = await fn();
                } catch (ex) {
                    this.rollback(ctx);
                    throw ex;
                }
                this.commit(ctx);
                return result;
            });
        }
        if (isolation == null) {
            return transactionStorage.run(ctx, async () => {
                this.open(ctx);
                try {
                    return await fn();
                } finally {
                    this.close(ctx);
                }
            });
        }
        return transactionStorage.run(ctx, async () => {
            let result: R;
            this.open(ctx);
            try {
                this.begin(ctx);
                try {
                    result = await fn();
                } catch (ex) {
                    this.rollback(ctx);
                    throw ex;
                }
                this.commit(ctx);
            } finally {
                this.close(ctx);
            }
            return result;
        });
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
}

export class TransactionContext {
    constructor(
        readonly isolation: Isolation | undefined, // Undefined means no transaction
        readonly timeout: number,
        readonly savepoint: boolean
    ) {
    }
}

const transactionStorage = new AsyncLocalStorage<TransactionContext>();

function validateIsolation(
    oldValue: Isolation,
    newValue: Isolation
) {
    if (isolationLevel(oldValue) < isolationLevel(newValue)) {
        throw new err.ArgumentError(
            `Cannot join existing transaction: ` +
            `requested isolation ${newValue} is stricter than ` +
            `current ${oldValue}`
        );
    }
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
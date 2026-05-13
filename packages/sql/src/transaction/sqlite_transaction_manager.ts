import { Isolation, Propagation } from "@ts-grm/core";
import { AbstractTransactionManager, TransactionContext } from "./abstract_transaction_manager";
import { Database } from "better-sqlite3";

export class SqliteTransactionManager 
extends AbstractTransactionManager<SqliteTransactionContext> {

    constructor(
        readonly database: Database
    ) {
        super();
    }

    protected isPropgationSupported(propgation: Propagation): boolean {
        return propgation === "REQUIRED" || propgation === "MANDATORY" || propgation === "NESTED";
    }

    protected create(
        isolation: Isolation | undefined, 
        timeout: number, 
        prevForSavepoint: SqliteTransactionContext | undefined
    ): SqliteTransactionContext {
        return new SqliteTransactionContext(
            isolation,
            timeout,
            prevForSavepoint
        );    
    }

    protected async open(_: SqliteTransactionContext): Promise<void> {}

    protected async close(_: SqliteTransactionContext): Promise<void> {}

    protected async begin(ctx: SqliteTransactionContext): Promise<void> {
        if (ctx.savepointName != null) {
            this.database.exec(`savepoint ${ctx.savepointName}`);
        } else {
            const stmt = ctx.isolation === "SERIALIZABLE" ? "begin exclusive" 
                   : ctx.isolation === "REPEATABLE_READ" ? "begin immediate"
                   : "begin";
            this.database.exec(stmt);
        }
    }

    protected async commit(ctx: SqliteTransactionContext): Promise<void> {
        if (ctx.savepointName != null) {
            this.database.exec(`release savepoint ${ctx.savepointName}`);
        } else {
            this.database.exec(`commit`);
        }
    }

    protected async rollback(ctx: SqliteTransactionContext): Promise<void> {
        if (ctx.savepointName != null) {
            this.database.exec(`rollback to savepoint ${ctx.savepointName}`);
        } else {
            this.database.exec(`rollback`);
        }
    }
}

export class SqliteTransactionContext extends TransactionContext<SqliteTransactionContext> {

    private static _savepointIdSequence = 0;

    readonly savepointName: string | undefined;

    constructor(
        isolation: Isolation | undefined,
        timeout: number,
        prevForSavepoint: SqliteTransactionContext | undefined
    ) {
        super(isolation, timeout, prevForSavepoint);
        this.savepointName = prevForSavepoint != null
            ? `savepoint_${++SqliteTransactionContext._savepointIdSequence}`
            : undefined
    }
}
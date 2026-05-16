import { Isolation, Propagation } from "@ts-grm/core";
import { AbstractTransactionManager, TransactionContext } from "./abstract_transaction_manager";
import { Database } from "better-sqlite3";
import { Executor } from "./executor";
import { Value } from "@/sql/fragment";
import { DataRows } from "@/impl/data_row_reader";

export class SqliteTransactionManager 
extends AbstractTransactionManager<SqliteTransactionContext> {

    constructor(
        readonly database: Database
    ) {
        super();
    }

    protected isPropagationSupported(propagation: Propagation): boolean {
        return propagation === "REQUIRED" || propagation === "MANDATORY" || propagation === "NESTED";
    }

    protected create(
        isolation: Isolation | undefined, 
        timeout: number, 
        prevForSavepoint: SqliteTransactionContext | undefined
    ): SqliteTransactionContext {
        return new SqliteTransactionContext(
            this.database,
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
        private readonly _database: Database,
        isolation: Isolation | undefined,
        timeout: number,
        prevForSavepoint: SqliteTransactionContext | undefined
    ) {
        super(isolation, timeout, prevForSavepoint);
        this.savepointName = prevForSavepoint != null
            ? `savepoint_${++SqliteTransactionContext._savepointIdSequence}`
            : undefined
    }

    protected createExecutor(): Executor {
        return new SqliteExecutor(this._database);
    }
}

class SqliteExecutor implements Executor {

    constructor(
        private readonly _database: Database
    ) {}

    async execute(sql: string): Promise<void> {
        this._database.exec(sql);
    }

    async executeStatement(
        sql: string, 
        args: ReadonlyArray<Value>
    ): Promise<DataRows> {
        const stmt = this._database.prepare(sql);
        stmt.raw(true);
        const values = args.map(v => v.value);
        return (stmt.get(values) ?? []) as ReadonlyArray<any>;
    }

    async executeStatements(
        sql: string, 
        binds: ReadonlyArray<ReadonlyArray<Value>>
    ): Promise<ReadonlyArray<DataRows>> {
        const results: Array<DataRows> = [];
        const stmt = this._database.prepare(sql);
        stmt.raw(true);
        for (const args of binds) {
            const values = args.map(v => v.value);
            const rows = stmt.get(values) as ReadonlyArray<any>;
            results.push(rows);
        }
        return results;
    }
}
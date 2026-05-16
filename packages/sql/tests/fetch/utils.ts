import { SqlClient } from "@ts-grm/core";
import { SqlRecord, useSqliteClient } from "../utils";
import { beforeAll } from "vitest";

export function useSqliteClientWithData(sqlRecord: SqlRecord): SqlClient {
    const sqlClient = useSqliteClient(true, sqlRecord);
    beforeAll(async () => {
        const schema = await sqlClient.createSchema();
        await schema.execute();
        await sqlClient.execute(async () => {
            for (const part of INITIAL_SQL.split(";")) {
                const sql = part.trim();
                if (sql === "") {
                    continue;
                }
                await sqlClient.executor.execute(sql);
            }
        });
    });
    return sqlClient;
}

const INITIAL_SQL = `
insert into BOOK_STORE(ID, TYPE, NAME, VERSION, URL)
    values(1, 'OnlineBookStore', 'O''REILLY', 1, 'https://www.oreilly.com');
insert into BOOK_STORE(ID, TYPE, NAME, VERSION, CITY, STREET)
    values(2, 'PhysicalBookStore', 'MANNING', 1, 'Shelter Island', '20 Baldwin Road');

insert into BOOK(ID, TYPE, NAME, EDITION, PRICE, STORE_ID)
    values(1, 'ElectronicBook', 'Learning GraphQL', 1, 33.99, 1);
insert into BOOK(ID, TYPE, NAME, EDITION, PRICE, STORE_ID)
    values(2, 'ElectronicBook', 'Learning GraphQL', 2, 33.99, 1);
insert into BOOK(ID, TYPE, NAME, EDITION, PRICE, STORE_ID)
    values(3, 'ElectronicBook', 'Learning GraphQL', 3, 33.99, 1);
insert into BOOK(ID, TYPE, NAME, EDITION, PRICE, STORE_ID)
    values(4, 'PaperBook', 'Effective TypeScript', 1, 43.99, 1);
insert into BOOK(ID, TYPE, NAME, EDITION, PRICE, STORE_ID)
    values(5, 'PaperBook', 'Effective TypeScript', 2, 53.99, 1);
insert into BOOK(ID, TYPE, NAME, EDITION, PRICE, STORE_ID)
    values(6, 'PaperBook', 'Effective TypeScript', 3, 63.99, 1);
insert into BOOK(ID, TYPE, NAME, EDITION, PRICE, STORE_ID)
    values(7, 'PaperBook', 'YugabyteDB: The Definitive Guide', 1, 69.99, 1);
insert into BOOK(ID, TYPE, NAME, EDITION, PRICE, STORE_ID)
    values(8, 'PaperBook', 'YugabyteDB: The Definitive Guide', 2, 79.99, 1);
insert into BOOK(ID, TYPE, NAME, EDITION, PRICE, STORE_ID)
    values(9, 'PaperBook', 'YugabyteDB: The Definitive Guide', 3, 89.99, 1);
insert into BOOK(ID, TYPE, NAME, EDITION, PRICE, STORE_ID)
    values(10, 'PaperBook', 'GraphQL in Action', 1, 59.99, 2);
insert into BOOK(ID, TYPE, NAME, EDITION, PRICE, STORE_ID)
    values(11, 'PaperBook', 'GraphQL in Action', 2, 69.99, 2);
insert into BOOK(ID, TYPE, NAME, EDITION, PRICE, STORE_ID)
    values(12, 'PaperBook', 'GraphQL in Action', 3, 79.99, 2);
`;
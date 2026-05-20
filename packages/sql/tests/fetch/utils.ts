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
                try {
                    await sqlClient.executor.execute(sql);
                } catch (ex) {
                    console.error("Failed to execute", sql);
                    throw ex;
                }
            }
        });
    });
    return sqlClient;
}

const INITIAL_SQL = `
insert into BOOK_STORE(ID, TYPE, NAME, VERSION, URL) values
    (1, 'OnlineBookStore', 'O''REILLY', 1, 'https://www.oreilly.com');
insert into BOOK_STORE(ID, TYPE, NAME, VERSION, CITY, STREET) values
    (2, 'PhysicalBookStore', 'MANNING', 1, 'Shelter Island', '20 Baldwin Road');

insert into BOOK(ID, TYPE, NAME, EDITION, PRICE, STORE_ID) values
    (1, 'ElectronicBook', 'Learning GraphQL', 1, 33.99, 1),
    (2, 'ElectronicBook', 'Learning GraphQL', 2, 33.99, 1),
    (3, 'ElectronicBook', 'Learning GraphQL', 3, 33.99, 1),
    (4, 'PaperBook', 'Effective TypeScript', 1, 43.99, 1),
    (5, 'PaperBook', 'Effective TypeScript', 2, 53.99, 1),
    (6, 'PaperBook', 'Effective TypeScript', 3, 63.99, 1),
    (7, 'PaperBook', 'YugabyteDB: The Definitive Guide', 1, 69.99, 1),
    (8, 'PaperBook', 'YugabyteDB: The Definitive Guide', 2, 79.99, 1),
    (9, 'PaperBook', 'YugabyteDB: The Definitive Guide', 3, 89.99, 1),
    (10, 'PaperBook', 'GraphQL in Action', 1, 59.99, 2),
    (11, 'PaperBook', 'GraphQL in Action', 2, 69.99, 2),
    (12, 'PaperBook', 'GraphQL in Action', 3, 79.99, 2);

insert into author(id, first_name, last_name) values
    (1, 'Eve', 'Procello'),
    (2, 'Alex', 'Banks'),
    (3, 'Dan', 'Vanderkam'),
    (4, 'Karthik', 'Ranganathan'),
    (5, 'Kannappan', 'Muthukkaruppan'),
    (6, 'Mikhail', 'Bautin'),
    (7, 'Samer', 'Buna');

insert into book_author_mapping(book_id, author_id) values
    (1, 1),
    (2, 1),
    (3, 1),

    (1, 2),
    (2, 2),
    (3, 2),

    (4, 3),
    (5, 3),
    (6, 3),

    (7, 4),
    (8, 4),
    (9, 4),

    (7, 5),
    (8, 5),
    (9, 5),

    (7, 6),
    (8, 6),
    (9, 6),

    (10, 7),
    (11, 7),
    (12, 7);

insert into "ORDER"(X, A, B, NAME) values
    (1, 1, 1, 'order-1'),
    (1, 1, 2, 'order-2'),
    (2, 1, 1, 'order-3'),
    (2, 1, 2, 'order-4');

insert into ORDER_ITEM(ID, PRODUCT_NAME, order_x, order_y_a, order_y_b) values
    (1, 'Pen', 1, 1, 1),
    (2, 'Pencil', 1, 1, 1),
    (3, 'Panio', 1, 1, 2),
    (4, 'Bike', 1, 1, 2),
    (5, 'Bag', 2, 1, 1),
    (6, 'TV', 2, 1, 1),
    (7, 'Computer', 2, 1, 2),
    (8, 'iPhone', 2, 1, 2);

insert into TAG(LOW, HIGH, NAME) values
    (1, 1, 'red'),
    (1, 2, 'orange'),
    (1, 3, 'yellow'),
    (1, 4, 'green'),
    (2, 1, 'cyan'),
    (2, 2, 'blue'),
    (2, 3, 'purple');

insert into ORDER_TAG_MAPPING(order_x, order_y_a, order_y_b, tag_low, tag_high) values
    (1, 1, 1, 1, 2),
    (1, 1, 1, 1, 3),
    (1, 1, 2, 1, 4),
    (1, 1, 2, 2, 1),
    (2, 1, 1, 2, 2),
    (2, 1, 1, 2, 3),
    (2, 1, 2, 1, 1),
    (2, 1, 2, 1, 2);
`;
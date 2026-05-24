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
                    console.error("Failed to execute: ", sql, ex);
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

insert into TREE_NODE(
    ID, TYPE, NAME, PARENT_NODE_ID
) values
    (1, 'Group', 'Home', null),
        (2, 'Group', 'Food', 1),
            (3, 'Group', 'Drinks', 2),
                (4, 'Group', 'Coca Cola', 3),
                (5, 'Group', 'Fanta', 3),
            (6, 'Group', 'Bread', 2),
                (7, 'Group', 'Baguette', 6),
                (8, 'Group', 'Ciabatta', 6),
        (9, 'Group', 'Clothing', 1),
            (10, 'Group', 'Woman', 9),
                (11, 'Group', 'Casual wear', 10),
                    (12, 'Group', 'Dress', 11),
                    (13, 'Group', 'Miniskirt', 11),
                    (14, 'Group', 'Jeans', 11),
                (15, 'Group', 'Formal wear', 10),
                    (16, 'Group', 'Suit', 15),
                    (17, 'Group', 'Shirt', 15),
            (18, 'Group', 'Man', 9),
                (19, 'Group', 'Casual wear', 18),
                    (20, 'Group', 'Jacket', 19),
                    (21, 'Group', 'Jeans', 19),
                (22, 'Group', 'Formal wear', 18),
                    (23, 'Group', 'Suit', 22),
                    (24, 'Group', 'Shirt', 22);

insert into LIBRARY(ID, NAME, VERSION) values
    (1, 'react', '18.2.0'),
    (2, 'react-dom', '18.2.0'),
    (3, 'preact', '10.19.0'),
    (4, 'loose-envify', '1.4.0'),
    (5, 'js-tokens', '4.0.0'),
    (6, 'scheduler', '0.23.0'),
    (7, 'webpack', '5.88.0'),
    (8, 'preact-render-to-string', '6.3.0'),
    (9, 'preact-jsx-runtime', '1.0.0'),
    (10, 'terser', '5.19.0'),
    (11, '@babel/core', '7.22.0'),
    (12, '@babel/preset-env', '7.22.0'),
    (13, '@babel/preset-react', '7.22.0'),
    (14, 'babel-loader', '9.1.0');

insert into LIBRARY_DEPENDENCY_MAPPING(DEPENDENT_ID, DEPENDENCY_ID) values
    (1, 4),
    (1, 6),
    (2, 1),
    (2, 6),
    (2, 4),
    (4, 5),
    (3, 4),
    (3, 6),
    (3, 1),
    (3, 2),
    (2, 7),
    (3, 7),
    (7, 10),
    (7, 11),
    (11, 12),
    (12, 13),
    (13, 14);
`;
import { describe, expect, it } from "vitest";
import { newSqlRecord } from "../utils";
import { useSqliteClientWithData } from "../data_utils";
import { dto } from "@ts-grm/core";
import { AUTHOR, BOOK } from "../model/model";

describe("CriteriaSqliteTest", () => {

    const sqlRecord = newSqlRecord();

    const sqlClient = useSqliteClientWithData(sqlRecord);

    it("simple", async () => {
        const view = dto.view(BOOK, c => [
            c.name,
            c.store.with(c => [c.name]),
            c.authors.with(c => [c.name])
        ]);
        const row = await sqlClient.findOne(view, {
            name: { $contains: "Yugabyte" },
            edition: 3
        });
        sqlRecord.assert(
            {
                sql: `
                    select 
                        tb_1_.NAME,
                        tb_1_.STORE_ID,
                        tb_1_.ID
                    from BOOK tb_1_
                    where 
                            tb_1_.NAME like ?
                        and
                            tb_1_.EDITION = ?
                    limit ?
                `,
                args: ["%Yugabyte%", 3, 2],
                purpose: "query"
            },
            {
                sql: `
                    select 
                        tb_1_.ID,
                        tb_1_.NAME
                    from BOOK_STORE tb_1_
                    where 
                        tb_1_.ID = ?
                `,
                args: [1],
                purpose: "loadAssociation(Book.store)"
            },
            {
                sql: `
                    select 
                        tb_2_.book_id,
                        tb_1_.FIRST_NAME,
                        tb_1_.LAST_NAME
                    from AUTHOR tb_1_
                    inner join book_author_mapping tb_2_ on 
                        tb_1_.ID = tb_2_.author_id
                    where 
                        tb_2_.book_id = ?
                    order by 
                        tb_1_.FIRST_NAME asc,
                        tb_1_.LAST_NAME asc
                `,
                args: [9],
                purpose: "loadAssociation(Book.authors)"
            }
        );
        expect(row).toEqual({
            "name": "YugabyteDB: The Definitive Guide",
            "store": {
                "name": "O'REILLY"
            },
            "authors": [
                {
                    "name": {
                        "firstName": "Kannappan",
                        "lastName": "Muthukkaruppan"
                    }
                },
                {
                    "name": {
                        "firstName": "Karthik",
                        "lastName": "Ranganathan"
                    }
                },
                {
                    "name": {
                        "firstName": "Mikhail",
                        "lastName": "Bautin"
                    }
                }
            ]
        });
    });

    it("embedded", async() => {
        const view = dto.view(AUTHOR, c => [
            c.name,
            c.books.with(c => [
                c.name,
                c.store.with(c => [c.name])
            ])
        ]);
        const rows = await sqlClient.findMany(view, {
            criteria: {
                name: {
                    $or: {
                        firstName: { $icontains: "m" },
                        lastName: { $icontains: "m" }
                    }
                }
            },
            orders: "id"
        });
        sqlRecord.assert(
            {
                sql: `
                    select 
                        tb_1_.FIRST_NAME,
                        tb_1_.LAST_NAME,
                        tb_1_.ID
                    from AUTHOR tb_1_
                    where 
                            lower(tb_1_.FIRST_NAME) like ?
                        or
                            lower(tb_1_.LAST_NAME) like ?
                    order by 
                        tb_1_.ID asc
                `,
                args: ["%m%", "%m%"],
                purpose: "query"
            },
            {
                sql: `
                    select 
                        tb_2_.author_id,
                        tb_1_.NAME,
                        tb_1_.STORE_ID
                    from BOOK tb_1_
                    inner join book_author_mapping tb_2_ on 
                        tb_1_.ID = tb_2_.book_id
                    where 
                        tb_2_.author_id in(?, ?, ?, ?)
                    order by 
                        tb_1_.NAME asc,
                        tb_1_.EDITION asc
                `,
                args: [3, 5, 6, 7],
                purpose: "loadAssociation(Author.books)"
            },
            {
                sql: `
                    select 
                        tb_1_.ID,
                        tb_1_.NAME
                    from BOOK_STORE tb_1_
                    where 
                        tb_1_.ID in(?, ?)
                `,
                args: [1, 2],
                purpose: "loadAssociation(Book.store)"
            }
        );
        expect(rows).toEqual([
            {
                "name": {
                    "firstName": "Dan",
                    "lastName": "Vanderkam"
                },
                "books": [
                    {
                        "name": "Effective TypeScript",
                        "store": {
                            "name": "O'REILLY"
                        }
                    },
                    {
                        "name": "Effective TypeScript",
                        "store": {
                            "name": "O'REILLY"
                        }
                    },
                    {
                        "name": "Effective TypeScript",
                        "store": {
                            "name": "O'REILLY"
                        }
                    }
                ]
            },
            {
                "name": {
                    "firstName": "Kannappan",
                    "lastName": "Muthukkaruppan"
                },
                "books": [
                    {
                        "name": "YugabyteDB: The Definitive Guide",
                        "store": {
                            "name": "O'REILLY"
                        }
                    },
                    {
                        "name": "YugabyteDB: The Definitive Guide",
                        "store": {
                            "name": "O'REILLY"
                        }
                    },
                    {
                        "name": "YugabyteDB: The Definitive Guide",
                        "store": {
                            "name": "O'REILLY"
                        }
                    }
                ]
            },
            {
                "name": {
                    "firstName": "Mikhail",
                    "lastName": "Bautin"
                },
                "books": [
                    {
                        "name": "YugabyteDB: The Definitive Guide",
                        "store": {
                            "name": "O'REILLY"
                        }
                    },
                    {
                        "name": "YugabyteDB: The Definitive Guide",
                        "store": {
                            "name": "O'REILLY"
                        }
                    },
                    {
                        "name": "YugabyteDB: The Definitive Guide",
                        "store": {
                            "name": "O'REILLY"
                        }
                    }
                ]
            },
            {
                "name": {
                    "firstName": "Samer",
                    "lastName": "Buna"
                },
                "books": [
                    {
                        "name": "GraphQL in Action",
                        "store": {
                            "name": "MANNING"
                        }
                    },
                    {
                        "name": "GraphQL in Action",
                        "store": {
                            "name": "MANNING"
                        }
                    },
                    {
                        "name": "GraphQL in Action",
                        "store": {
                            "name": "MANNING"
                        }
                    }
                ]
            }
        ]);
    });

    it("implicitSome", async() => {
        const view = dto.view(BOOK, c => [
            c.name,
            c.store.with(c => [c.name]),
            c.authors.with(c => [c.name])
        ]);
        const rows = await sqlClient.findMany(view, {
            criteria: {
                authors: {
                    $or: [
                        {
                            gender: "FEMALE"
                        },
                        {
                            name: {
                                firstName: { $icontains: "a" },
                                lastName: { $icontains: "a" }
                            }
                        }
                    ]
                }
            },
            orders: ["name", { path: "edition", desc: true }]
        });
        sqlRecord.log();
    });
});
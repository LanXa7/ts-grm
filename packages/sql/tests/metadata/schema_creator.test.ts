import { SqliteDriver } from "@/driver/sqlite_driver";
import { createSchema } from "@/impl/schema_creator";
import { newSqlClient, SqlClientImplementor } from "@/sql_client";
import { EntityManager } from "@ts-grm/core";
import { describe, it, expect } from "vitest";

describe.sequential("SchemaCreatorTest", () => {

    const sqlClient = newSqlClient(new SqliteDriver(), {
        entityManager: EntityManager.of(__dirname, "../model")
    }) as SqlClientImplementor;

    it("tables", async() => {
        const tableDefs = await createSchema(sqlClient);
        expect(tableDefs.map(t => (t as any).toJSON())).toEqual([
            {
                "name": "BOOK_STORE",
                "columns": [
                    {
                        "name": "ID",
                        "type": "I64",
                        "nullable": false
                    },
                    {
                        "name": "TYPE",
                        "type": "STR",
                        "nullable": false,
                        "length": 17
                    },
                    {
                        "name": "NAME",
                        "type": "STR",
                        "nullable": false
                    },
                    {
                        "name": "VERSION",
                        "type": "I32",
                        "nullable": false
                    },
                    {
                        "name": "CITY",
                        "type": "STR",
                        "nullable": true,
                        "when": ["PhysicalBookStore"]
                    },
                    {
                        "name": "STREET",
                        "type": "STR",
                        "nullable": true,
                        "when": ["PhysicalBookStore"]
                    },
                    {
                        "name": "URL",
                        "type": "STR",
                        "nullable": true,
                        "when": ["OnlineBookStore"]
                    }
                ],
                "constraints": [
                    {
                        "kind": "PRIMARY_KEY",
                        "columns": ["ID"]
                    },
                    {
                        "kind": "CHECK",
                        "column": "TYPE",
                        "values": [
                            "PhysicalBookStore",
                            "OnlineBookStore"
                        ]
                    }
                ]
            },
            {
                "name": "BOOK",
                "columns": [
                    {
                        "name": "ID",
                        "type": "I64",
                        "nullable": false
                    },
                    {
                        "name": "TYPE",
                        "type": "STR",
                        "nullable": false,
                        "length": 17
                    },
                    {
                        "name": "NAME",
                        "type": "STR",
                        "nullable": false
                    },
                    {
                        "name": "EDITION",
                        "type": "I32",
                        "nullable": false
                    },
                    {
                        "name": "PRICE",
                        "type": "NUM",
                        "nullable": false
                    },
                    {
                        "name": "STORE_ID",
                        "referenceName": "ID",
                        "type": "I64",
                        "nullable": true
                    }
                ],
                "constraints": [
                    {
                        "kind": "PRIMARY_KEY",
                        "columns": ["ID"]
                    },
                    {
                        "kind": "CHECK",
                        "column": "TYPE",
                        "values": [
                            "Book",
                            "PaperBook",
                            "ElectronicBook",
                            "PdfElectronicBook"
                        ]
                    },
                    {
                        "kind": "UNIQUE",
                        "columns": ["NAME", "EDITION"]
                    },
                    {
                        "kind": "FOREIGN_KEY",
                        "columns": ["STORE_ID"],
                        "referencedColumns": ["ID"],
                        "cascade": "DELETE"
                    }
                ]
            },
            {
                "name": "AUTHOR",
                "columns": [
                    {
                        "name": "ID",
                        "type": "I64",
                        "nullable": false
                    },
                    {
                        "name": "FIRST_NAME",
                        "type": "STR",
                        "nullable": false
                    },
                    {
                        "name": "LAST_NAME",
                        "type": "STR",
                        "nullable": false
                    }
                ],
                "constraints": [
                    {
                        "kind": "PRIMARY_KEY",
                        "columns": ["ID"]
                    }
                ]
            },
            {
                "name": "book_author_mapping",
                "columns": [
                    {
                        "name": "BOOK_ID",
                        "referenceName": "ID",
                        "type": "I64",
                        "nullable": false
                    },
                    {
                        "name": "AUTHOR_ID",
                        "referenceName": "ID",
                        "type": "I64",
                        "nullable": false
                    }
                ],
                "constraints": [
                    {
                        "kind": "PRIMARY_KEY",
                        "columns": ["BOOK_ID", "AUTHOR_ID"]
                    },
                    {
                        "kind": "FOREIGN_KEY",
                        "columns": ["BOOK_ID"],
                        "referencedColumns": ["ID"],
                        "cascade": "NONE"
                    },
                    {
                        "kind": "FOREIGN_KEY",
                        "columns": ["AUTHOR_ID"],
                        "referencedColumns": ["ID"],
                        "cascade": "NONE"
                    }
                ]
            },
            {
                "name": "PAPER_BOOK",
                "columns": [
                    {
                        "name": "PB_ID",
                        "type": "I64",
                        "nullable": false
                    },
                    {
                        "name": "WIDTH",
                        "type": "I32",
                        "nullable": false
                    },
                    {
                        "name": "HEIGHT",
                        "type": "I32",
                        "nullable": false
                    }
                ],
                "constraints": [
                    {
                        "kind": "PRIMARY_KEY",
                        "columns": ["PB_ID"]
                    },
                    {
                        "kind": "FOREIGN_KEY",
                        "columns": ["PB_ID"],
                        "referencedColumns": ["ID"],
                        "cascade": "DELETE"
                    }
                ]
            },
            {
                "name": "ELECTRONIC_BOOK",
                "columns": [
                    {
                        "name": "EB_ID",
                        "type": "I64",
                        "nullable": false
                    },
                    {
                        "name": "EB_TYPE",
                        "type": "STR",
                        "nullable": false,
                        "length": 17
                    },
                    {
                        "name": "ADDRESS",
                        "type": "STR",
                        "nullable": false
                    }
                ],
                "constraints": [
                    {
                        "kind": "PRIMARY_KEY",
                        "columns": ["EB_ID"]
                    },
                    {
                        "kind": "CHECK",
                        "column": "EB_TYPE",
                        "values": [
                            "ElectronicBook",
                            "PdfElectronicBook"
                        ]
                    },
                    {
                        "kind": "FOREIGN_KEY",
                        "columns": ["EB_ID"],
                        "referencedColumns": ["ID"],
                        "cascade": "DELETE"
                    }
                ]
            },
            {
                "name": "PDF_ELECTRONIC_BOOK",
                "columns": [
                    {
                        "name": "PEB_ID",
                        "type": "I64",
                        "nullable": false
                    },
                    {
                        "name": "PDF_VERSION",
                        "type": "STR",
                        "nullable": true
                    }
                ],
                "constraints": [
                    {
                        "kind": "PRIMARY_KEY",
                        "columns": [
                            "PEB_ID"
                        ]
                    },
                    {
                        "kind": "FOREIGN_KEY",
                        "columns": ["PEB_ID"],
                        "referencedColumns": ["EB_ID"],
                        "cascade": "DELETE"
                    }
                ]
            },
            {
                "name": "TREE_NODE",
                "columns": [
                    {
                        "name": "ID",
                        "type": "I64",
                        "nullable": false
                    },
                    {
                        "name": "TYPE",
                        "type": "STR",
                        "nullable": false,
                        "length": 12
                    },
                    {
                        "name": "NAME",
                        "type": "STR",
                        "nullable": false
                    },
                    {
                        "name": "PARENT_NODE_ID",
                        "referenceName": "ID",
                        "type": "I64",
                        "nullable": false
                    }
                ],
                "constraints": [
                    {
                        "kind": "PRIMARY_KEY",
                        "columns": ["ID"]
                    },
                    {
                        "kind": "CHECK",
                        "column": "TYPE",
                        "values": [
                            "Organization",
                            "Group"
                        ]
                    },
                    {
                        "kind": "FOREIGN_KEY",
                        "columns": ["PARENT_NODE_ID"],
                        "referencedColumns": ["ID"],
                        "cascade": "NONE"
                    }
                ]
            },
            {
                "name": "ORGANIZATION",
                "columns": [
                    {
                        "name": "ID",
                        "type": "I64",
                        "nullable": false
                    },
                    {
                        "name": "LOCATION",
                        "type": "STR",
                        "nullable": false
                    },
                    {
                        "name": "KIND",
                        "type": "STR",
                        "nullable": false
                    }
                ],
                "constraints": [
                    {
                        "kind": "PRIMARY_KEY",
                        "columns": ["ID"]
                    },
                    {
                        "kind": "FOREIGN_KEY",
                        "columns": ["ID"],
                        "referencedColumns": ["ID"],
                        "cascade": "DELETE"
                    }
                ]
            },
            {
                "name": "GROUP",
                "columns": [
                    {
                        "name": "ID",
                        "type": "I64",
                        "nullable": false
                    },
                    {
                        "name": "EMAIL",
                        "type": "STR",
                        "nullable": false
                    }
                ],
                "constraints": [
                    {
                        "kind": "PRIMARY_KEY",
                        "columns": ["ID"]
                    },
                    {
                        "kind": "FOREIGN_KEY",
                        "columns": ["ID"],
                        "referencedColumns": ["ID"],
                        "cascade": "DELETE"
                    }
                ]
            },
            {
                "name": "ORDER",
                "columns": [
                    {
                        "name": "X",
                        "type": "I32",
                        "nullable": false
                    },
                    {
                        "name": "A",
                        "type": "I16",
                        "nullable": false
                    },
                    {
                        "name": "B",
                        "type": "I16",
                        "nullable": false
                    },
                    {
                        "name": "NAME",
                        "type": "STR",
                        "nullable": false
                    }
                ],
                "constraints": [
                    {
                        "kind": "PRIMARY_KEY",
                        "columns": ["X", "A", "B"]
                    }
                ]
            },
            {
                "name": "TAG",
                "columns": [
                    {
                        "name": "LOW",
                        "type": "I32",
                        "nullable": false
                    },
                    {
                        "name": "HIGH",
                        "type": "I32",
                        "nullable": false
                    },
                    {
                        "name": "NAME",
                        "type": "STR",
                        "nullable": false
                    }
                ],
                "constraints": [
                    {
                        "kind": "PRIMARY_KEY",
                        "columns": ["LOW", "HIGH"]
                    }
                ]
            },
            {
                "name": "ORDER_TAG_MAPPING",
                "columns": [
                    {
                        "name": "order_x",
                        "referenceName": "X",
                        "type": "I32",
                        "nullable": false
                    },
                    {
                        "name": "order_y_a",
                        "referenceName": "A",
                        "type": "I16",
                        "nullable": false
                    },
                    {
                        "name": "order_y_b",
                        "referenceName": "B",
                        "type": "I16",
                        "nullable": false
                    },
                    {
                        "name": "tag_low",
                        "referenceName": "LOW",
                        "type": "I32",
                        "nullable": false
                    },
                    {
                        "name": "tag_high",
                        "referenceName": "HIGH",
                        "type": "I32",
                        "nullable": false
                    }
                ],
                "constraints": [
                    {
                        "kind": "PRIMARY_KEY",
                        "columns": [
                            "order_x",
                            "order_y_a",
                            "order_y_b",
                            "tag_low",
                            "tag_high"
                        ]
                    },
                    {
                        "kind": "FOREIGN_KEY",
                        "columns": ["order_x", "order_y_a", "order_y_b"],
                        "referencedColumns": ["X", "A", "B"],
                        "cascade": "DELETE"
                    },
                    {
                        "kind": "FOREIGN_KEY",
                        "columns": ["tag_low", "tag_high"],
                        "referencedColumns": ["LOW", "HIGH"],
                        "cascade": "NONE"
                    }
                ]
            },
            {
                "name": "COMMENT",
                "columns": [
                    {
                        "name": "ID",
                        "type": "I64",
                        "nullable": false
                    },
                    {
                        "name": "NAME",
                        "type": "STR",
                        "nullable": false
                    },
                    {
                        "name": "TEXT",
                        "type": "STR",
                        "nullable": false
                    }
                ],
                "constraints": [
                    {
                        "kind": "PRIMARY_KEY",
                        "columns": ["ID"]
                    }
                ]
            },
            {
                "name": "ORDER_COMMENT_MAPPING",
                "columns": [
                    {
                        "name": "order_x",
                        "referenceName": "X",
                        "type": "I32",
                        "nullable": false
                    },
                    {
                        "name": "order_y_a",
                        "referenceName": "A",
                        "type": "I16",
                        "nullable": false
                    },
                    {
                        "name": "order_y_b",
                        "referenceName": "B",
                        "type": "I16",
                        "nullable": false
                    },
                    {
                        "name": "COMMENT_ID",
                        "referenceName": "ID",
                        "type": "I64",
                        "nullable": false
                    }
                ],
                "constraints": [
                    {
                        "kind": "PRIMARY_KEY",
                        "columns": [
                            "order_x",
                            "order_y_a",
                            "order_y_b",
                            "COMMENT_ID"
                        ]
                    },
                    {
                        "kind": "FOREIGN_KEY",
                        "columns": ["order_x", "order_y_a", "order_y_b"],
                        "referencedColumns": ["X", "A", "B"],
                        "cascade": "NONE"
                    },
                    {
                        "kind": "FOREIGN_KEY",
                        "columns": ["COMMENT_ID"],
                        "referencedColumns": ["ID"],
                        "cascade": "NONE"
                    }
                ]
            },
            {
                "name": "ORDER_ITEM",
                "columns": [
                    {
                        "name": "ID",
                        "type": "I64",
                        "nullable": false
                    },
                    {
                        "name": "PRODUCT_NAME",
                        "type": "STR",
                        "nullable": false
                    },
                    {
                        "name": "order_x",
                        "referenceName": "X",
                        "type": "I32",
                        "nullable": false
                    },
                    {
                        "name": "order_y_a",
                        "referenceName": "A",
                        "type": "I16",
                        "nullable": false
                    },
                    {
                        "name": "order_y_b",
                        "referenceName": "B",
                        "type": "I16",
                        "nullable": false
                    }
                ],
                "constraints": [
                    {
                        "kind": "PRIMARY_KEY",
                        "columns": [
                            "ID"
                        ]
                    },
                    {
                        "kind": "FOREIGN_KEY",
                        "columns": ["order_x", "order_y_a", "order_y_b"],
                        "referencedColumns": ["X", "A", "B"],
                        "cascade": "DELETE"
                    }
                ]
            },
            {
                "name": "STUDENT",
                "columns": [
                    {
                        "name": "ID",
                        "type": "I64",
                        "nullable": false
                    },
                    {
                        "name": "NAME",
                        "type": "STR",
                        "nullable": false
                    }
                ],
                "constraints": [
                    {
                        "kind": "PRIMARY_KEY",
                        "columns": ["ID"]
                    }
                ]
            },
            {
                "name": "COURSE",
                "columns": [
                    {
                        "name": "ID",
                        "type": "I64",
                        "nullable": false
                    },
                    {
                        "name": "NAME",
                        "type": "STR",
                        "nullable": false
                    }
                ],
                "constraints": [
                    {
                        "kind": "PRIMARY_KEY",
                        "columns": ["ID"]
                    }
                ]
            },
            {
                "name": "LEARNING_LINK",
                "columns": [
                    {
                        "name": "ID",
                        "type": "I64",
                        "nullable": false
                    },
                    {
                        "name": "SCORE",
                        "type": "I16",
                        "nullable": true
                    },
                    {
                        "name": "STUDENT_ID",
                        "referenceName": "ID",
                        "type": "I64",
                        "nullable": false
                    },
                    {
                        "name": "COURSE_ID",
                        "referenceName": "ID",
                        "type": "I64",
                        "nullable": false
                    }
                ],
                "constraints": [
                    {
                        "kind": "PRIMARY_KEY",
                        "columns": ["ID"]
                    },
                    {
                        "kind": "UNIQUE",
                        "columns": ["STUDENT_ID", "COURSE_ID"]
                    },
                    {
                        "kind": "FOREIGN_KEY",
                        "columns": ["STUDENT_ID"],
                        "referencedColumns": ["ID"],
                        "cascade": "NONE"
                    },
                    {
                        "kind": "FOREIGN_KEY",
                        "columns": ["COURSE_ID"],
                        "referencedColumns": ["ID"],
                        "cascade": "NONE"
                    }
                ]
            }
        ]);
    });
});
import { dto } from "@ts-grm/core";
import { describe, it, expect } from "vitest";
import { BOOK } from "../model/model";
import { newSqlRecord } from "../utils";
import { useSqliteClientWithData } from "./utils";

describe.sequential("FoldSqliteTest", () => {

    const sqlRecord = newSqlRecord();
    
    const sqlClient = useSqliteClientWithData(sqlRecord);

    it("simple", async () => {
        const view = dto.view(BOOK, $ => $
            .fold("key", $ => $
                .name
                .edition
            )
            .fold("associations", $ => $
                .store($ => $
                    .id
                    .fold("key", $ => $
                        .name
                        .version
                    )
                )
                .authors($ => $.name())
            )
        );
        const row = await sqlClient.createQuery(BOOK, (q, book) => {
            q.where(book.id.eq(9));
            return q.select(
                book.fetch(view)
            );
        }).fetchRequired();
        expect(row).toEqual({
            "key": {
                "name": "YugabyteDB: The Definitive Guide",
                "edition": 3
            },
            "associations": {
                "store": {
                    "id": 1,
                    "key": {
                        "name": "O'REILLY",
                        "version": 1
                    }
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
            }
        });
    });

    it("mixedWithFlat", async () => {
        const view = dto.view(BOOK, $ => $
            .fold("key", $ => $
                .name
                .edition
            )
            .fold("associations", $ => $
                .flat("store", $ => $
                    .id
                    .fold("key", $ => $
                        .name
                        .version
                    )
                )
                .authors($ => $
                    .flat({prop: "name", prefix: ""})
                )
            )
        );
        const row = await sqlClient.createQuery(BOOK, (q, book) => {
            q.where(book.id.eq(9));
            return q.select(
                book.fetch(view)
            );
        }).fetchRequired();
        console.log(JSON.stringify(row));
    });
});
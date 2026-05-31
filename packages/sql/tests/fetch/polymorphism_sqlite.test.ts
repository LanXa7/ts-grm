import { describe, it } from "vitest";
import { newSqlRecord } from "../utils";
import { useSqliteClientWithData } from "./utils";
import { dto } from "@ts-grm/core";
import { BOOK_STORE, PAPER_BOOK, ELECTRONIC_BOOK, PDF_ELECTRONIC_BOOK } from "../model/model";

describe("PolymorphismSqliteTest", () => {

    const sqlRecord = newSqlRecord();

    const sqlClient = useSqliteClientWithData(sqlRecord);

    it("multipleTables", async () => {

        const view = dto.view(BOOK_STORE, $ => $
            .name
            .books(
                $ => $
                    .name
                    .instanceOf(PAPER_BOOK, $ => $
                        .size($ => $.width.height)
                    )
                    .instanceOf(ELECTRONIC_BOOK, $ => $
                        .address
                    )
                    .instanceOf(PDF_ELECTRONIC_BOOK, $ => $
                        .pdfVersion
                    )
            )
        );
        const rows = await sqlClient.createQuery(BOOK_STORE, (q, store) => {
            return q.select(
                store.fetch(view)
            );
        }).fetchList();
        sqlRecord.log();
        console.log(JSON.stringify(rows));
    });
});
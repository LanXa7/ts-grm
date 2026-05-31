import { describe, it } from "vitest";
import { newSqlRecord } from "../utils";
import { useSqliteClientWithData } from "./utils";
import { BOOK } from "../model/model";
import { dto } from "@ts-grm/core";

describe.sequential("OptimizationTest", () => {

    const sqlRecord = newSqlRecord();

    const sqlClient = useSqliteClientWithData(sqlRecord);

    it("m2o", async() => {
        const view = dto.view(BOOK, $ => $
            .allScalars()
            .store($ => $.id)
        );
        const rows = await sqlClient.createQuery(BOOK, (q, book) => {
            q.where(book.storeId.eq(2));
            return q.select(book.fetch(view));
        }).fetchList();
        sqlRecord.log();
    });
});
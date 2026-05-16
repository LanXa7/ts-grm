import { describe, it } from "vitest";
import { useSqliteClientWithData } from "./utils";
import { BOOK } from "../model/model";
import { SIMPLE_BOOK_VIEW } from "../query/utils";

describe.sequential("SqliteFetchTest", () => {

    const sqlClient = useSqliteClientWithData();
    
    it("simple", async() => {
        const rows = await sqlClient.createQuery(BOOK, (q, book) => {
            q.where(book.storeId.eq(2));
            return q.select(
                book.fetch(SIMPLE_BOOK_VIEW)
            );
        }).fetchList();
        console.log(JSON.stringify(rows));
    });
});
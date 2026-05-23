import { dto } from "@ts-grm/core";
import { describe, it } from "vitest";
import { TREE_NODE } from "../model/model";
import { useSqliteClientWithData } from "./utils";
import { newSqlRecord } from "../utils";

describe.sequential("RecursiveTest", () => {

    const sqlRecord = newSqlRecord();

    const sqlClient = useSqliteClientWithData(sqlRecord);

    it("up", async () => {
        const view = dto.view(TREE_NODE, $ => $
            .name
            .recursive("parentNode")
        );
        const row = await sqlClient.createQuery(TREE_NODE, (q, treeNode) => {
            q.where(treeNode.id.in(5, 8));
            return q.select(treeNode.fetch(view));
        }).fetchList();
        sqlRecord.log();
        console.log(row);
    });

    it("down", async () => {
        const view = dto.view(TREE_NODE, $ => $
            .name
            .recursive("childNodes")
        );
        const row = await sqlClient.createQuery(TREE_NODE, (q, treeNode) => {
            q.where(treeNode.id.eq(1));
            return q.select(treeNode.fetch(view));
        }).fetchList();
        sqlRecord.log();
        console.log(JSON.stringify(row));
    });
});
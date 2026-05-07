import { EntityManager } from "@ts-grm/core";
import { describe, expect, it } from "vitest";

describe.sequential("EntityManagerTest", () => {
    it("test", async() => {
        const entityManager = EntityManager.of(
            __dirname,
            "../model"
        );
        const names = Array.from(await entityManager.entities()).map(entity => entity.name);
        names.sort();
        expect(names).toEqual([
            'Author',
            'Book',
            'BookStore',
            'Comment',
            'Course',
            'ElectronicBook',
            'Group',
            'LearningLink',
            'OnlineBookStore',
            'Order',
            'OrderItem',
            'Organization',
            'PaperBook',
            'PdfElectronicBook',
            'PhysicalBookStore',
            'Student',
            'Tag',
            'TreeNode'
        ]);
    });
});
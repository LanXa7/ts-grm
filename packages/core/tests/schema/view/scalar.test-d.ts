import { describe, it } from "node:test";
import { AUTHOR, BOOK, LEARNING_LINK } from "../../model/model";
import { expectTypeOf } from "vitest";
import { dto, TypeOf } from "@/index";
import { z } from "zod";

describe("ScalarTest", () => {

    it("simple", () => {
        const view = dto.view(BOOK, c => [
            c.id,
            c.name,
            c.edition
        ]);
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            id: number;
            name: string;
            edition: number;
        }>();
    });

    it("null", () => {
        const view = dto.view(LEARNING_LINK, c => [
            c.id,
            c.score
        ]);
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            id: number;
            score: number | null;
        }>();
    });

    it("undefined", () => {
        const view = dto.view.nullAsUndefined(LEARNING_LINK, c => [
            c.id,
            c.score
        ]);
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            id: number;
            score: number | undefined;
        }>();
    });

    it("alias", () => {
        const view = dto.view(BOOK, c => [
            c.id.as("bookId"),
            c.name.as("bookName"),
            c.edition.as("bookEdition")
        ]);
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            bookId: number;
            bookName: string;
            bookEdition: number;
        }>();
    });

    it("output", () => {
        const view = dto.view(AUTHOR, c => [
            c.id,
            c.gender.output(z.enum(["BOY", "GIRL"]), value => {
                return value === "MALE" ? "BOY" : "GIRL"
            })
        ]);
        expectTypeOf<TypeOf<typeof view>>().toEqualTypeOf<{
            gender: "BOY" | "GIRL";
            id: number;
        }>();
    });
});
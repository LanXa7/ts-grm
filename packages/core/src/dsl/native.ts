import { supressUnused } from "@/utils";
import { Expression } from "./expression";

export function num(sql: string): Expression<number> {
    supressUnused(sql);
    throw new Error();
}
import { NativeNumExpr } from "@/impl/ast/native_expr";
import { Expression } from ".";

export function num(sql: string): Expression<number> {
    return new NativeNumExpr<number>(sql) as any as Expression<number>;
}
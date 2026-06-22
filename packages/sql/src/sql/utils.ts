import { metadata } from "@ts-grm/core";
import { Column, Composite, Scope } from "./fragment";
import { RealTable } from "./real_table";

export function addTypeMatch(
    table: RealTable,
    currentEntity: metadata.Entity | undefined,
    castToEntity: metadata.Entity,
    createColumn: (realTable: RealTable, columnName: string) => Column,
    negative: boolean,
    composite: Composite
): void {
    const values = castToEntity.discriminatorValues;
    if (values.length == 0) {
        composite.add(negative ? "1 = 1" : "1 = 0");
    } else {
        const tableSettings = (currentEntity ?? table.symbol.__entity!).tableSettings;
        composite.add(
            createColumn(
                table, 
                tableSettings.discriminator!.name
            )
        )
        if (values.length === 1) {
            composite.add(negative ? "<>" : " = ");
            if (tableSettings.discriminator!.type === "string") {
                composite.add(`'${values[0]}'`);
            } else {
                composite.add(values[0]!.toString());
            }
        } else {
            composite.add(negative ? "not in" : " in");
            const valueScope = new Scope("VALUES", false);
            if (tableSettings.discriminator!.type === "string") {
                for (const value of values) {
                    valueScope.separator().add(`'${value}'`);
                }
            } else {
                for (const value of values) {
                    valueScope.separator().add(value.toString());
                }
            }
            composite.add(valueScope);
        }
    }
}
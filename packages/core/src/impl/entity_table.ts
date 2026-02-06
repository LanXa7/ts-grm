import { CodeWriter } from "./code_writer";
import { Entity } from "./entity";
import { EntityProp } from "./entity_prop";
import { Predicate } from "@/dsl/expression";

export abstract class AbstractEntityTable {

    constructor(
        readonly joinOperation: JoinOperation
    ) {}
}

export type JoinOperation = {
    readonly parent: AbstractEntityTable;
    readonly joinProp: EntityProp | undefined;
    readonly filter: JoinFilter | undefined;
};

export type JoinFilter = (
    source: AbstractEntityTable, 
    target: AbstractEntityTable
) => Predicate;

export function createEntityTable(
    entity: Entity
) : AbstractEntityTable {

    const superClass = 
        entity.superEntity != null 
            ? entity.superEntity.table.constructor 
            : AbstractEntityTable;
    
    const writer = new CodeWriter();
    writer
        .code("return class extends $baseClass ")
        .scope("CURLY_BRACKETS", () => {
            writeConstructor(writer);
            for (const prop of entity.declaredPropMap.values()) {
                writeProp(prop, writer);
            }
        });
    const cls = new Function("$baseClass", writer.toString())(superClass);
    return new cls();
}

function writeConstructor(writer: CodeWriter) {
    writer
        .code("constructor(joinOperation) ")
        .scope("CURLY_BRACKETS", () => {
            writer.code("super(joinOperation)").newLine(";");
        })
        .newLine();
}

function writeProp(prop: EntityProp, writer: CodeWriter) {
    console.log(prop);
    console.log(writer);
}

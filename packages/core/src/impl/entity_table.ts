import { supressUnused } from "@/utils";
import { CodeWriter } from "./code_writer";
import { Entity } from "./entity";
import { EntityProp } from "./entity_prop";
import { Predicate } from "@/dsl/expression";

export abstract class AbstractEntityTable {

    constructor(
        readonly entity: Entity,
        readonly joinOperation: JoinOperation | undefined
    ) {
    }

    __type(): {
        tableLike: true;
        entityTable: true;
    } {
        return {
            tableLike: true,
            entityTable: true
        }
    }

    $acceptRisk(): this {
        return this;
    }
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

export type EntityTableCtor = new(
    entity: Entity,
    joinOperation: JoinOperation | undefined
) => AbstractEntityTable;

export function createEntityTableClass(
    entity: Entity
) : EntityTableCtor {

    const superClass = 
        entity.superEntity != null 
            ? entity.superEntity.table.constructor 
            : AbstractEntityTable;
    
    const writer = new CodeWriter();
    writer
        .code("return class ThisClass extends $baseClass ")
        .scope("CURLY_BRACKETS", () => {
            writeConstructor(writer);
            for (const prop of entity.declaredPropMap.values()) {
                writeProp(prop, writer);
            }
            for (const prop of entity.declaredPropMap.values()) {
                writeEntityProp(prop, writer);
            }
        });
    return new Function("$baseClass", "$entity", writer.toString())(superClass, entity);
}

function writeConstructor(writer: CodeWriter) {
    writer
        .code("constructor(entity, joinOperation) ")
        .scope("CURLY_BRACKETS", () => {
            writer.code("super(entity, joinOperation)").newLine(";");
        })
        .newLine();
}

function writeProp(prop: EntityProp, writer: CodeWriter) {
    supressUnused(prop);
    supressUnused(writer);
}

function writeEntityProp(prop: EntityProp, writer: CodeWriter) {
    if (prop.props != null) {
        for (const subProp of prop.props.values()) {
            writeEntityProp(subProp, writer);
        }
        return;
    }
    if (prop.targetEntity == null && prop.scalarType == null) {
        return;
    }
    writer.code("static __");
    writeEntityPropPath(prop, "_", writer);
    writer.code(" = $entity.expanedPropMap.get(\"");
    writeEntityPropPath(prop, ".", writer);
    writer.code("\")").newLine(";");
}

function writeEntityPropPath(prop: EntityProp, separator: string, writer: CodeWriter) {
    if (prop.parentProp == null) {
        writer.code(prop.name);
    } else {
        writeEntityPropPath(prop.parentProp, separator, writer);
        writer.code(separator);
        writer.code(prop.name);
    }
}

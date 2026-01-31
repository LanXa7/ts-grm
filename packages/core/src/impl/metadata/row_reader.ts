import { CodeWriter } from "./code_writer";
import { DataReader } from "./data_reader";
import { DtoMapper } from "./dto_mapper";
import { buildShape, Shape } from "./shape";

export type Row = {

    readonly reader: RowReader;
    
    readonly parent: Row;

    readonly dto: object;

    readonly implicit: object;
}

export abstract class RowReader {

    abstract create(parent: Row | undefined, reader: DataReader): Row;
}

export function createRowReader(mapper: DtoMapper): RowReader {

    const shape = buildShape(mapper);

    const writer = new CodeWriter();
    writer
        .code("return class extends $baseClass ")
        .scope("CURLY_BRACKETS", () => {
            writeCreate(shape, mapper, writer);
            writeFold("", shape, mapper.nullAsUndefined, writer);
        });
    const cls = new Function("$baseClass", writer.toString())(RowReader);
    return new cls();
}

function writeCreate(
    shape: Shape,
    mapper: DtoMapper,
    writer: CodeWriter
) {
    const implicit = shape.__implicit;
    writer.code("create(parent, reader) ");
    writer.scope("CURLY_BRACKETS", () => {
        writer
            .code("const dto = ")
            .scope("CURLY_BRACKETS", () => {
                for (const key in shape) {
                    if (key !== "__implicit") {
                        writeRootMember(key, shape[key], mapper.nullAsUndefined, writer);
                    }
                }
            })
            .newLine(";");
        writeDepthAssignments(mapper, writer);
        if (implicit == null) {
            writer.code("return { reader: this, parent, dto, implicit: undefined };");
            return;
        }
        writer
            .code("const implicit = ")
            .scope("CURLY_BRACKETS", () => {
                for (const key in implicit) {
                    writeRootMember(key, implicit[key], mapper.nullAsUndefined, writer);
                }
            })
            .newLine(";")
            .code("return { reader: this, parent, dto, implicit };");
    }).newLine();
}

function writeRootMember(
    key: string, 
    member: any, 
    nullAsUndefined: boolean,
    writer: CodeWriter
) {
    writer.separator();
    if (typeof member === "number") {
        writer.code(key).code(": reader.get(").code(`${member}`).code(")");
    } else if (nullAsUndefined) {
        writer.code(key).code(": undefined");
    } else {
        writer.code(key).code(": null");
    }
}

function writeDepthAssignments(
    mapper: DtoMapper,
    writer: CodeWriter
) {
    for (const field of mapper.fields) {
        if (field.columnIndex == null) {
            continue;
        }
        for (const path of field.paths) {
            if (typeof path === "string") {
                continue;
            }
            if (path.length === 1) {
                continue;
            }
            writer
                .code("this._")
                .code(path.slice(0, path.length - 1).join("_"))
                .code("(dto).") 
                .code(path[path.length - 1]!)
                .code(" = reader.get(")
                .code(`${field.columnIndex}`)
                .code(")")
                .newLine(";");
        }
    }
}

function writeFold(
    contextPath: string,
    shape: Shape, 
    nullAsUndefined: boolean,
    writer: CodeWriter
) {
    for (const key in shape) {
        if (key === "__implicit") {
            continue;
        }
        const member = shape[key];
        if (typeof member !== "object") {
            continue;
        }
        if ((member as any).__array != null || (member as any).__ref != null) {
            continue;
        }
        writer.code(contextPath).code("_").code(key).code("(dto) ");
        writer.scope("CURLY_BRACKETS", () => {
            const parent = contextPath !== "" ? `${contextPath}()` : "dto";
            writer.code(`let o = ${parent}.${key}`).newLine(";");
            writer.code("if (o == null) ").scope("CURLY_BRACKETS", () => {
                writer.code(`${parent}.${key} = o = `);
                writer.scope("CURLY_BRACKETS", () => {
                    writeFoldBody(member, nullAsUndefined, writer);
                }).newLine(";");
            }).newLine();
            writer.code("return o").newLine(";");
        }).newLine();
        writeFold(
            `${contextPath}_${key}`,
            member,
            nullAsUndefined,
            writer
        );
    }
}

function writeFoldBody(
    member: Shape, 
    nullAsUndefined: boolean, 
    writer: CodeWriter
) {
    for (const deepKey in member) {
        if (deepKey === "__implicit") {
            continue;
        }
        const deepMember = member[deepKey];
        if ((deepMember as any).__array != null || (deepMember as any).__ref != null) {
            continue;
        }
        writer.separator().code(deepKey).code(": ");
        if (nullAsUndefined) {
            writer.code("undefined");
        } else {
            writer.code("null");
        }
    }
};
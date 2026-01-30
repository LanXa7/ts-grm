import { CodeWriter } from "./code_writer";
import { DataReader } from "./data_reader";
import { DtoMapper } from "./dto_mapper";
import { buildShape, Shape } from "./shape";

export type Row = {

    readonly mapper: RowMapper;
    
    readonly parent: Row;

    readonly dto: object;

    readonly implicit: object;
}

export abstract class RowMapper {

    abstract create(parent: Row | undefined, reader: DataReader): Row;
}

export function createRowMapper(mapper: DtoMapper): RowMapper {

    const shape = buildShape(mapper);

    const writer = new CodeWriter();
    writer
        .code("return class extends $baseClass ")
        .scope("CURLY_BRACKETS", () => {
            writeCreate(shape, mapper.nullAsUndefined, writer);
        });
    const cls = new Function("$baseClass", writer.toString())(RowMapper);
    return new cls();
}

function writeCreate(
    shape: Shape,
    nullAsUndefined: boolean,
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
                        writeRootMember(key, shape[key], nullAsUndefined, writer);
                    }
                }
            })
            .newLine(";");
        if (implicit == null) {
            writer.code("return { mapper: this, parent, dto, implicit: undefined };");
            return;
        }
        writer
            .code("const implicit = ")
            .scope("CURLY_BRACKETS", () => {
                for (const key in implicit) {
                    writeRootMember(key, implicit[key], nullAsUndefined, writer);
                }
            })
            .newLine(";")
            .code("return { mapper: this, parent, dto, implicit };");
    });
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
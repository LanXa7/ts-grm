import { CodeWriter } from "./code_writer";
import { DataReader } from "./data_reader";
import { DtoMapper,DtoMapperField } from "./dto_mapper";
import { buildShape, isEmptyShape, Shape } from "./shape";
import { ArgumentError } from "@/error/common";

export type DtoRow = {

    readonly reader: DtoRowReader;
    
    readonly parent: DtoRow;

    readonly dto: object;

    readonly implicit: object;
}

export abstract class DtoRowReader {

    abstract read(parent: DtoRow | undefined, reader: DataReader): DtoRow;

    dependency(unresolvedFieldIndex: number, _: DtoRow) {
        throw new ArgumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
    }

    dependencyNullable(unresolvedFieldIndex: number, _: any): boolean {
        throw new ArgumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
    }

    dependencyHash(unresolvedFieldIndex: number, _: any): any {
        throw new ArgumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
    }

    resolve(unresolvedFieldIndex: number, _1: DtoRow, _2: any) {
        throw new ArgumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
    }
}

export function createDtoRowReader(mapper: DtoMapper): DtoRowReader {

    const shape = buildShape(mapper);

    const writer = new CodeWriter();
    writer
        .code("return class extends $baseClass ")
        .scope("CURLY_BRACKETS", () => {
            writeRead(shape, mapper, writer);
            writeFold("", shape, mapper.nullAsUndefined, writer);
            if (shape.__implicit != null) {
                writeFold("_implicit", shape.__implicit, mapper.nullAsUndefined, writer);
            }
            if (mapper.unresolvedFields.length !== 0) {
                writeDependency(mapper, writer);
                writeDependencyNullable(mapper, writer);
                writeDependencyHash(mapper, writer);
                writeResolve(mapper, writer);
            }
        });
    const cls = new Function("$baseClass", "$argumentError", writer.toString())(DtoRowReader, ArgumentError);
    return new cls();
}

function writeRead(
    shape: Shape,
    mapper: DtoMapper,
    writer: CodeWriter
) {
    const implicit = shape.__implicit;
    writer.code("read(parent, reader) ");
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
        if (implicit != null) {
            writer
                .code("const implicit = ")
                .scope("CURLY_BRACKETS", () => {
                    for (const key in implicit) {
                        writeRootMember(key, implicit[key], mapper.nullAsUndefined, writer);
                    }
                })
                .newLine(";");
        }
        writeDepthAssignments(mapper, writer);
        if (implicit == null) {
            writer.code("return { reader: this, parent, dto, implicit: undefined };");
            return;
        }
        writer.code("return { reader: this, parent, dto, implicit };");
    }).newLine();
}

function writeRootMember(
    key: string, 
    member: any, 
    nullAsUndefined: boolean,
    writer: CodeWriter
) {
    if (typeof member === "object" && isEmptyShape(member)) {
        return;
    }
    const keyStr = key.startsWith("←") ? `"${key}"` : key;
    writer.separator();
    if (typeof member === "number") {
        writer.code(keyStr).code(": reader.get(").code(`${member}`).code(")");
    } else if (nullAsUndefined) {
        writer.code(keyStr).code(": undefined");
    } else {
        writer.code(keyStr).code(": null");
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
            writeAssignmentTarget("", path, writer);
            writer
                .code(" = reader.get(")
                .code(`${field.columnIndex}`)
                .code(")")
                .newLine(";");
        }
    }
}

function writeAssignmentTarget(
    prefix: string,
    path: ReadonlyArray<string>,
    writer: CodeWriter
) {
    const parents: Array<string> = [];
    for (const part of path) {
        if (part === "..") {
            parents.push(`parent`);
        } else if (part.startsWith("<implicit:") && part.endsWith(">")) {
            parents.push(`implicit`);
        } else {
            break;
        }
    }
    const dto = parents.length === 0
        ? `${prefix}dto`
        : parents[0] === "implicit"
            ? `${prefix}${parents.join(".")}`
            : `${prefix}${parents.join(".")}.dto`;
    const foldKeys =
        parents[0] === "implicit" 
            ? ["implicit", path[0]!.substring(10, path[0]!.length - 1), ...path.slice(parents.length, path.length - 1)]
            : path.slice(parents.length, path.length - 1);
    const target = foldKeys.length === 0
        ? dto
        : `this._${foldKeys.join("_")}(${dto})`;
    writer
        .code(target)
        .code(".")
        .code(path[path.length - 1]!);
}

function writeFold(
    contextPath: string,
    shape: Shape, 
    nullAsUndefined: boolean,
    writer: CodeWriter
) {
    const parameterName = contextPath.startsWith("_implicit")
        ? "implicit"
        : "dto";
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
        if (isEmptyShape(member)) {
            continue;
        }
        writer.code(contextPath).code("_").code(key).code("(").code(parameterName).code(") ");
        writer.scope("CURLY_BRACKETS", () => {
            const parent = contextPath !== "" && contextPath !== "_implicit" ? `this.${contextPath}(${parameterName})` : parameterName;
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
        writer.separator().code(deepKey).code(": ");
        if (nullAsUndefined) {
            writer.code("undefined");
        } else {
            writer.code("null");
        }
    }
};

function writeDependency(
    mapper: DtoMapper,
    writer: CodeWriter
) {
    writer.code("dependency(unresolvedFieldIndex, row) ").scope("CURLY_BRACKETS", () => {
        writer.code("switch (unresolvedFieldIndex) ").scope("CURLY_BRACKETS", () => {
            for (const unresolvedField of mapper.unresolvedFields) {
                writer.code(`case ${unresolvedField.index}:`).scope("BLANK", () => {
                    const dependencies = unresolvedField.dependencies!;
                    if (dependencies.length === 1) {
                        writer.code("return ");
                        writeDependencyRef(mapper.fields[dependencies[0]!]!, writer);
                    } else {
                        writer.code("return ").scope({kind: "SQUARE_BRACKETS", multiline: true}, () => {
                            for (const dependency of dependencies) {
                                writer.separator();
                                writeDependencyRef(mapper.fields[dependency]!, writer);
                            }
                        });
                    }
                    writer.newLine(";");
                });
            }
            writer.code("default:").scope("BLANK", () => {
                writeUnresolvedFieldIndexError(writer);
            });
            return;
        });
    }).newLine();
}

function writeDependencyNullable(
    mapper: DtoMapper,
    writer: CodeWriter
) {
    writer.code("dependencyNullable(unresolvedFieldIndex, dependency) ").scope("CURLY_BRACKETS", () => {
        writer.code("switch (unresolvedFieldIndex) ").scope("CURLY_BRACKETS", () => {
            for (const unresolvedField of mapper.unresolvedFields) {
                writer.code(`case ${unresolvedField.index}:`).scope("BLANK", () => {
                    const dependencies = unresolvedField.dependencies!;
                    if (dependencies.length === 1) {
                        writer.code("return dependency == null");
                    } else {
                        writer.code("return ");
                        for (let i = 0; i < dependencies.length; i++) {
                            if (i != 0) {
                                writer.code(" && ");
                            }
                            writer.code("dependency[");
                            writer.code(i.toString());
                            writer.code("] == null");
                        }
                    }
                    writer.newLine(";");
                });
            }
            writer.code("default:").scope("BLANK", () => {
                writeUnresolvedFieldIndexError(writer);
            });
            return;
        });
    }).newLine();
}

function writeDependencyHash(
    mapper: DtoMapper,
    writer: CodeWriter
) {
    writer.code("dependencyHash(unresolvedFieldIndex, dependency) ").scope("CURLY_BRACKETS", () => {
        writer.code("switch (unresolvedFieldIndex) ").scope("CURLY_BRACKETS", () => {
            for (const unresolvedField of mapper.unresolvedFields) {
                writer.code(`case ${unresolvedField.index}:`).scope("BLANK", () => {
                    const dependencies = unresolvedField.dependencies!;
                    if (dependencies.length === 1) {
                        writer.code("return dependency");
                    } else {
                        writer.code("return ");
                        for (let i = 0; i < dependencies.length; i++) {
                            if (i != 0) {
                                writer.code(' + "\\x1F" + ');
                            }
                            writer.code("dependency[");
                            writer.code(i.toString());
                            writer.code("]");
                        }
                    }
                    writer.newLine(";");
                });
            }
            writer.code("default:").scope("BLANK", () => {
                writeUnresolvedFieldIndexError(writer);
            });
            return;
        });
    }).newLine();
}

function writeResolve(
    mapper: DtoMapper,
    writer: CodeWriter
) {
    writer.code("resolve(unresolvedFieldIndex, row, value) ").scope("CURLY_BRACKETS", () => {
        writer.code("switch (unresolvedFieldIndex) ").scope("CURLY_BRACKETS", () => {
            for (const unresolvedField of mapper.unresolvedFields) {
                writer.code(`case ${unresolvedField.index}:`).scope("BLANK", () => {
                    for (const path of unresolvedField.paths) {
                        writeAssignmentTarget("row.", typeof path === "string" ? [path] : path, writer);
                        writer.code(" = value").newLine(";");
                    }
                    writer.code("break").newLine(";");
                });
            }
            writer.code("default:").scope("BLANK", () => {
                writeUnresolvedFieldIndexError(writer);
            });
            return;
        });
    }).newLine();
}

function writeDependencyRef(
    dependencyField: DtoMapperField,
    writer: CodeWriter
) {
    if (dependencyField.paths.length === 0) {
        writer.code(`row.implicit._${dependencyField.index}`);
        return;
    }
    const path = dependencyField.paths[0]!;
    writer.code("row");
    const subPaths = typeof path === "string" 
        ? [path]
        : path;
    let metFirst = false;
    for (let i = 0; i < subPaths.length; i++) {
        const subPath = subPaths[i]!;
        if (subPath === "..") {
            writer.code(".parent");
        } else if (subPath.startsWith("<implicit:") && subPath.endsWith(">")) {
            writer.code("._implicit.").code(subPath.substring(10, subPath.length - 1));
            metFirst = true;
        } else {
            const prefix = metFirst ? "?." : ".dto.";
            writer.code(prefix).code(subPath);
            metFirst = true;
        }
    }
}

function writeUnresolvedFieldIndexError(
    writer: CodeWriter
) {
    writer.code('throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex)').newLine(";");
}
import { dto } from "@/index";
import { describe, it, expect } from "vitest";
import { COURSE, STUDENT } from "../../model/model";
import { makeReader, mapperJson } from "./utils";
import { buildShape } from "@/impl/shape";
import { expectCode } from "../../utils";

describe("JoinEntityTest", () => {

    it("joinEntity", () => {
        const view = dto.view(
            STUDENT, 
            $ => $.id.name.courses(
                $ => $.allScalars()
            )
        );
        expect(mapperJson(view.mapper)).toEqual({
            "entity": "Student",
            "fields": [
                {
                    "prop": "Student.id",
                    "paths": ["id"],
                    "isDependent": true,
                    "columnIndex": 0
                },
                {
                    "prop": "Student.name",
                    "paths": ["name"],
                    "columnIndex": 1
                },
                {
                    "prop": "Student.learningLinks",
                    "paths": ["courses"], 
                    "subMapper": {
                        "entity": "LearningLink",
                        "associatedProp": "Student.learningLinks",
                        "fields": [
                            {
                                "prop": "LearningLink.courseId",
                                "paths": [], // Implicit field to fetch `LearningLink.course`
                                "isDependent": true,
                                "columnIndex": 0
                            },
                            {
                                "prop": "LearningLink.course",
                                "paths": [],
                                "subMapper": {
                                    "entity": "Course",
                                    "associatedProp": "LearningLink.course",
                                    "fields": [
                                        {
                                            "prop": "Course.id",
                                            "paths": [
                                                ["..", "id"]
                                            ],
                                            "columnIndex": 0
                                        },
                                        {
                                            "prop": "Course.name",
                                            "paths": [
                                                ["..", "name"]
                                            ],
                                            "columnIndex": 1
                                        }
                                    ]
                                },
                                "dependencies": [0]
                            }
                        ]
                    },
                    "dependencies": [0]
                }
            ]
        });
        expect(buildShape(view.mapper)).toEqual({
            "id": 0,
            "name": 1,
            "courses": {
                "__array": {
                    "__implicit": {
                        "_0": 0
                    },
                    "id": 0,
                    "name": 1
                }
            }
        });

        expectCode(view.mapper.rowReader.constructor.toString(), `
            class extends $baseClass {
                read(parent, reader) {
                    const dto = {
                        id: reader.get(0), 
                        name: reader.get(1), 
                        courses: null
                    };
                    return { reader: this, parent, dto, implicit: undefined };
                }
                dependency(unresolvedFieldIndex, row) {
                    switch (unresolvedFieldIndex) {
                        case 2:
                            return row.dto.id;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                dependencyHash(unresolvedFieldIndex, dependency) {
                    switch (unresolvedFieldIndex) {
                        case 2:
                            return dependency;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                resolve(unresolvedFieldIndex, row, value) {
                    switch (unresolvedFieldIndex) {
                        case 2:
                            row.dto.courses = value;
                            break;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
            }
        `);
        const studentRow = view.mapper.rowReader.read(
            undefined,
            makeReader(1, "Sam")
        );
        expect(studentRow.dto).toEqual({
            id: 1,
            name: "Sam",
            courses: null
        });
        expect(studentRow.implicit).toEqual(undefined);

        const linkMapper = view.mapper.fields.find(f => f.prop.name === "learningLinks")!.subMapper!;
        expectCode(linkMapper.rowReader.constructor.toString(), `
            class extends $baseClass {
                read(parent, reader) {
                    const dto = {
                        id: null, 
                        name: null
                    };
                    const implicit = {
                        _0: reader.get(0)
                    };
                    return { reader: this, parent, dto, implicit };
                }
                dependency(unresolvedFieldIndex, row) {
                    switch (unresolvedFieldIndex) {
                        case 1:
                            return row._implicit._0;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                dependencyHash(unresolvedFieldIndex, dependency) {
                    switch (unresolvedFieldIndex) {
                        case 1:
                            return dependency;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                resolve(unresolvedFieldIndex, row, value) {
                    switch (unresolvedFieldIndex) {
                        case 1:
                            break;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
            }
        `);
        const linkRow = linkMapper.rowReader.read(
            studentRow,
            makeReader(2)
        );
        expect(linkRow.dto).toEqual({
            id: null,
            name: null
        });
        expect(linkRow.implicit).toEqual({_0: 2});

        const courseMapper = linkMapper.fields.find(f => f.prop.name === "course")!.subMapper!;
        expectCode(courseMapper.rowReader.constructor.toString(), `
            class extends $baseClass {
                read(parent, reader) {
                    const dto = {
                    };
                    parent.dto.id = reader.get(0);
                    parent.dto.name = reader.get(1);
                    return { reader: this, parent, dto, implicit: undefined };
                }
                dependency(unresolvedFieldIndex, row) {
                    throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                }
                dependencyHash(unresolvedFieldIndex, dependency) {
                    throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                }
                resolve(unresolvedFieldIndex, row, value) {
                    throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                }
            }
        `);
        courseMapper.rowReader.read(
            linkRow,
            makeReader(3, "English")
        );
        expect(linkRow.dto).toEqual({
            id: 3,
            name: "English"
        });
    });

    it("inverseJoinEntity", () => {
        const view = dto.view(
            COURSE, 
            $ => $.id.name.students(
                $ => $.allScalars()
            )
        );
        expect(mapperJson(view.mapper)).toEqual({
            "entity": "Course",
            "fields": [
                {
                    "prop": "Course.id",
                    "paths": ["id"],
                    "isDependent": true,
                    "columnIndex": 0
                },
                {
                    "prop": "Course.name",
                    "paths": ["name"],
                    "columnIndex": 1
                },
                {
                    "prop": "←LearningLink.course",
                    "paths": ["students"],
                    "subMapper": {
                        "entity": "LearningLink",
                        "associatedProp": "←LearningLink.course",
                        "fields": [
                            {
                                "prop": "LearningLink.studentId",
                                "paths": [], // Implicit field to fetch `LearningLink.student`
                                "isDependent": true,
                                "columnIndex": 0
                            },
                            {
                                "prop": "LearningLink.student",
                                "paths": [],
                                "subMapper": {
                                    "entity": "Student",
                                    "associatedProp": "LearningLink.student",
                                    "fields": [
                                        {
                                            "prop": "Student.id",
                                            "paths": [
                                                ["..", "id"]
                                            ],
                                            "columnIndex": 0
                                        },
                                        {
                                            "prop": "Student.name",
                                            "paths": [
                                                ["..", "name"]
                                            ],
                                            "columnIndex": 1
                                        }
                                    ]
                                },
                                "dependencies": [0]
                            }
                        ]
                    },
                    "dependencies": [0]
                }
            ]
        });
        expect(buildShape(view.mapper)).toEqual({
            "id": 0,
            "name": 1,
            "students": {
                "__array": {
                    "__implicit": {
                        "_0": 0
                    },
                    "id": 0,
                    "name": 1
                }
            }
        });

        expectCode(view.mapper.rowReader.constructor.toString(), `
            class extends $baseClass {
                read(parent, reader) {
                    const dto = {
                        id: reader.get(0), 
                        name: reader.get(1), 
                        students: null
                    };
                    return { reader: this, parent, dto, implicit: undefined };
                }
                dependency(unresolvedFieldIndex, row) {
                    switch (unresolvedFieldIndex) {
                        case 2:
                            return row.dto.id;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                dependencyHash(unresolvedFieldIndex, dependency) {
                    switch (unresolvedFieldIndex) {
                        case 2:
                            return dependency;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                resolve(unresolvedFieldIndex, row, value) {
                    switch (unresolvedFieldIndex) {
                        case 2:
                            row.dto.students = value;
                            break;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
            }
        `);
        const courseRow = view.mapper.rowReader.read(
            undefined,
            makeReader(3, "English")
        );
        expect(courseRow.dto).toEqual({
            id: 3,
            name: "English",
            students: null
        });
        expect(courseRow.implicit).toEqual(undefined);

        const linkMapper = view.mapper.fields.find(f => f.prop.name === "←LearningLink.course")!.subMapper!;
        expectCode(linkMapper.rowReader.constructor.toString(), `
            class extends $baseClass {
                read(parent, reader) {
                    const dto = {
                        id: null, 
                        name: null
                    };
                    const implicit = {
                        _0: reader.get(0)
                    };
                    return { reader: this, parent, dto, implicit };
                }
                dependency(unresolvedFieldIndex, row) {
                    switch (unresolvedFieldIndex) {
                        case 1:
                            return row._implicit._0;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                dependencyHash(unresolvedFieldIndex, dependency) {
                    switch (unresolvedFieldIndex) {
                        case 1:
                            return dependency;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
                resolve(unresolvedFieldIndex, row, value) {
                    switch (unresolvedFieldIndex) {
                        case 1:
                            break;
                        default:
                            throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                    }
                }
            }
        `);
        const linkRow = linkMapper.rowReader.read(
            courseRow,
            makeReader(2)
        );
        expect(linkRow.dto).toEqual({
            id: null,
            name: null
        });
        expect(linkRow.implicit).toEqual({_0: 2});

        const studentMapper = linkMapper.fields.find(f => f.prop.name === "student")!.subMapper!;
        expectCode(studentMapper.rowReader.constructor.toString(), `
            class extends $baseClass {
                read(parent, reader) {
                    const dto = {
                    };
                    parent.dto.id = reader.get(0);
                    parent.dto.name = reader.get(1);
                    return { reader: this, parent, dto, implicit: undefined };
                }
                dependency(unresolvedFieldIndex, row) {
                    throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                }
                dependencyHash(unresolvedFieldIndex, dependency) {
                    throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                }
                resolve(unresolvedFieldIndex, row, value) {
                    throw new $argumentError("Illegal unresolved field index: " + unresolvedFieldIndex);
                }
            }
        `);
        studentMapper.rowReader.read(
            linkRow,
            makeReader(1, "Sam")
        );
        expect(linkRow.dto).toEqual({
            id: 1,
            name: "Sam"
        });
    });

    it("mixed", () => {
        expect(() => dto.view(STUDENT, $ => $
            .allScalars()
            .learningLinks($ => $.id)
            .fold("tmp", $ => $.courses($ => $.id))
        )).toThrowError(`The property "Student.learningLinks" and "Student.courses" cannot be fetched together`);
    });
});
import { dto } from "@/schema/dto";
import { describe, expect, it } from "vitest";
import { BOOK } from "../../model/model";
import { DataReader } from "@/impl/metadata/data_reader";

function makeReader(...args: any[]): DataReader {
    return new class implements DataReader {
        next(): boolean {
            throw new Error("Unsupported Operation Error");
        }
        get(index: number): any {
            return args[index];
        }
    }
}

describe("RowMapperTest", () => {

    it("allScalars", () => {
        const view = dto.view(BOOK, $ => $
            .allScalars()
            .remove("price")
        );
        expect(view.mapper.rowMapper.constructor.toString()).toEqual(ALL_SCALARS_MAPPER_CODE);
        const row = view.mapper.rowMapper.create(
            undefined, 
            makeReader(3, "GraphQL in Action", 2)
        );
        expect(row.dto).toEqual({
            id: 3,
            name: "GraphQL in Action",
            edition: 2
        });
    });

    it("wideAssociations", () => {

        const view = dto.view(BOOK, $ => $
            .allScalars()
            .remove("id", "price")
            .store($ => $.allScalars())
            .authors($ => $.id.name())
        );
        expect(view.mapper.rowMapper.constructor.toString()).toEqual(WIDE_ASSOCIATIONS_MAPPER_CODE);
        // expect(
        //     view.mapper.rowMapper.create(
        //         undefined, 
        //         makeReader("GraphQL in Action", "")
        //     )
        // )
        const storeMapper = view
            .mapper
            .fields
            .find(f => f.prop.name === "store")!
            .subMapper!
            .rowMapper;
        expect(storeMapper.constructor.toString()).toEqual(WIDE_ASSOCIATIONS_STORE_MAPPER_CODE);

        const authorMapper = view
            .mapper
            .fields
            .find(f => f.prop.name === "authors")!
            .subMapper!
            .rowMapper;
        expect(authorMapper.constructor.toString()).toEqual(WIDE_ASSOCIATIONS_AUTHOR_MAPPER_CODE);
    });
});

const ALL_SCALARS_MAPPER_CODE = 
`class extends $baseClass {
    _template = {
        id: null, 
        name: null, 
        edition: null
    };
    create(parent, reader) {
        const row = {
            mapper: this, 
            parent, 
            dto: { ...this._template }, 
            implicit: undefined
        };
        const { dto } = row;
        dto.id = reader.get(0);
        dto.name = reader.get(1);
        dto.edition = reader.get(2);
        return row;
    }
}`;

const WIDE_ASSOCIATIONS_MAPPER_CODE =
`class extends $baseClass {
    _template = {
        name: null, 
        edition: null, 
        store: null, 
        authors: null
    };
    _implicitTemplate = {
        _2: null, 
        _4: null
    };
    create(parent, reader) {
        const row = {
            mapper: this, 
            parent, 
            dto: { ...this._template }, 
            implicit: { ...this._implicitTemplate }
        };
        const { dto, implicit } = row;
        dto.name = reader.get(0);
        dto.edition = reader.get(1);
        implicit._2 = reader.get(2);
        implicit._4 = reader.get(4);
        return row;
    }
}`;

const WIDE_ASSOCIATIONS_STORE_MAPPER_CODE =
`class extends $baseClass {
    _template = {
        id: null, 
        name: null, 
        version: null
    };
    create(parent, reader) {
        const row = {
            mapper: this, 
            parent, 
            dto: { ...this._template }, 
            implicit: undefined
        };
        const { dto } = row;
        dto.id = reader.get(0);
        dto.name = reader.get(1);
        dto.version = reader.get(2);
        return row;
    }
}`;

const WIDE_ASSOCIATIONS_AUTHOR_MAPPER_CODE =
`class extends $baseClass {
    _template = {
        id: null, 
        name: null
    };
    _template_name = {
        firstName: null, 
        lastName: null
    };
    create(parent, reader) {
        const row = {
            mapper: this, 
            parent, 
            dto: { ...this._template }, 
            implicit: undefined
        };
        const { dto } = row;
        dto.id = reader.get(0);
        return row;
    }
}`;
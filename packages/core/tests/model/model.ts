import { dsl } from "@/dsl";
import { dto } from "@/index";
import { SqlFormula, TsFormula, Calculator } from "@/schema/computed";
import { DV_MODEL_NAME, model } from "@/schema/model";
import { prop } from "@/schema/prop";
import { z } from "zod"; 

const BOOK_STORE_NEWEST_BOOK_CALCULATOR = Calculator.targetOf({
    sourceModel: () => BOOK_STORE,
    targetModel: () => BOOK,
    fn: ctx => {
        return ctx.sqlClient.createQuery(BOOK, (q, book) => {
            q.where(
                dsl.tuple(book.name, book.edition).inSubQuery(
                    dsl.subQuery(BOOK, (q, book) => {
                        q.where(book.storeId.in(...ctx.keys));
                        q.groupBy(book.storeId);
                        return q.select(book.name, dsl.max(book.edition).asNonNull());
                    })
                )
            );
            return q.select(
                book.storeId.asNonNull(),
                book.fetch(ctx.view)
            )
        }).fetchList();
    }
});

const BOOK_STORE_SPECIFIED_BOOK_CALCULATOR = Calculator.parameterizedTargetOf({
    parameterType: z.object({
        minEdition: z.number().nullish(),
        maxEdition: z.number().nullish()
    }),
    sourceModel: () => BOOK_STORE,
    targetModel: () => BOOK,
    fn: ctx => {
        return ctx.sqlClient.createQuery(BOOK, (q, book) => {
            q.where(book.storeId.in(...ctx.keys));
            q.where(book.edition.gteIf(ctx.parameter.minEdition));
            q.where(book.edition.lteIf(ctx.parameter.maxEdition));
            return q.select(
                book.storeId.asNonNull(),
                book.fetch(ctx.view)
            )
        }).fetchList();
    }
});

const BOOK_STORE_BOOK_NAMES_FORMULA: TsFormula<ReadonlyArray<string>> =
    TsFormula.of({
        view: () => dto.view(BOOK_STORE, $ => $.newestBooks($ => $.name)),
        fn: data => data.newestBooks.map(book => book.name)
    });

export const BOOK_STORE = model("BookStore", "id", class {
    id = prop.i64().asString()
    name = prop.str()
    version = prop.i32()
    books = prop.o2m(BOOK)
        .mappedBy("store")
        .orderBy("name", { path: "edition", desc: true })
    bookNames = prop.formula.ts(BOOK_STORE_BOOK_NAMES_FORMULA);
    newestBooks = prop.calculated.collection(BOOK_STORE_NEWEST_BOOK_CALCULATOR)
    specifiedBooks = prop.calculated.collection(BOOK_STORE_SPECIFIED_BOOK_CALCULATOR)
});

const BOOK_AUTHOR_COUNT_FORMULA: SqlFormula<number> = 
    SqlFormula.of({
        sourceModel: () => BOOK,
        fn: book => dsl.subQuery(
            dsl.associationModel(BOOK, "authors"), 
            (q, assoication) => {
                q.where(
                    assoication.sourceId.eq(book.id)
                );
                return q.select(dsl.count());
            }
        )
    });

export const BOOK = model("Book", "id", class {
    id = prop.i64()
    name = prop.str()
    edition = prop.i32()
    price = prop.num()
    store = prop.m2o(BOOK_STORE)
        .joinColumns({cascade: "DELETE"})
        .nullable()
    authors = prop.m2m(AUTHOR).joinTable({
        name: "book_author_mapping",
        joinThisColumns: ["book_id"],
        joinTargetColumns: ["author_id"]
    }).orderBy("name.firstName", "name.lastName")
    authorCount = prop.formula.sql(BOOK_AUTHOR_COUNT_FORMULA)
}, ctx => {
    ctx.table({
        discriminator: "TYPE",
        discriminatorValue: DV_MODEL_NAME
    }).unique("name", "edition");
});

export const PAPER_BOOK = model.extends(BOOK)(
    "PaperBook", 
    class {
        size = prop.embedded({
            width: prop.i32(),
            height: prop.i32()
        })
    },
    ctx => ctx.table({
        name: "THE_PAPER_BOOK",
        discriminatorValue: DV_MODEL_NAME
    })
);

export const ELECTRONIC_BOOK = model.extends(BOOK)(
    "ElectronicBook", 
    class {
        address = prop.str();
    },
    ctx => ctx.table({
        name: {
            idMapping: "ELECTRONIC_BOOK"
        },
        discriminatorValue: DV_MODEL_NAME
    })
);

export const PDF_ELECTRONIC_BOOK = model.extends(ELECTRONIC_BOOK)(
    "PdfElectronicBook",
    class {
        pdfVersion = prop.str().nullable()
    },
    ctx => ctx.table({
        discriminatorValue: DV_MODEL_NAME
    })
);

const AUTHOR_FULL_NAME_FORMULA: TsFormula<string> = 
    TsFormula.of({
        view: () => dto.view(AUTHOR, $ => $.name()),
        fn: data => `${data.name.firstName} ${data.name.lastName}`
    });

export const AUTHOR = model("Author", "id", class {
    id = prop.i64()
    name = prop.embedded({
        firstName: prop.str(),
        lastName: prop.str()
    })
    books = prop.m2m(BOOK).mappedBy("authors")
    fullName = prop.formula.ts(AUTHOR_FULL_NAME_FORMULA);
}, ctx => ctx.unique("name.firstName", "name.lastName"));

export const TREE_NODE = model("TreeNode", "id", class {
    id = prop.i64()
    name = prop.str()
    parentNode = prop.m2o.self(() => TREE_NODE, { joinColumns: { cascade: "DELETE" } })
    childNodes = prop.o2m.self(() => TREE_NODE, { mappedBy: "parentNode", sourceKeyProp: "id", targetKeyProp: "id" })
}, ctx => {
    ctx.unique("name", "parentNode");
});

export const ORDER = model("Order", "id", class {
    id = prop.embedded({
        x: prop.i32(),
        y: prop.embedded({
            a: prop.i16(),
            b: prop.i16()
        })
    });
    name = prop.num();
    items = prop.o2m(ORDER_ITEM).mappedBy("order")
    tags = prop.m2m(TAG).joinTable({
        joinThis: {
            keyProp: "id",
            columns: [
                {columnName: "order_x", referencedSubPath: "x"},
                {columnName: "order_y_a", referencedSubPath: "y.a"},
                {columnName: "order_y_b", referencedSubPath: "y.b"}
            ]
        },
        joinTarget: {
            keyProp: "id",
            columns: [
                {columnName: "tag_low", referencedSubPath: "low"},
                {columnName: "tag_high", referencedSubPath: "high"}
            ]
        }
    }).orderBy("id.low", "id.high");
    // Be different with `tags`, `comments` is not bidirectional
    comments = prop.m2m(COMMENT).joinTable({
        joinThis: {
            keyProp: "id",
            columns: [
                {columnName: "order_x", referencedSubPath: "x"},
                {columnName: "order_y_a", referencedSubPath: "y.a"},
                {columnName: "order_y_b", referencedSubPath: "y.b"}
            ]
        }
    })
}, ctx => {
    ctx.table({
        discriminator: {
            name: "TYPE",
            type: "number"
        },
        discriminatorValue: 1
    });
});

export const VIP_ORDER = model.extends(ORDER)("VipOrder", class {
    vipLevel = prop.num();
}, ctx => {
    ctx.table({
        name: {
            idMapping: {
                "x": "ID_X",
                "y.a": "ID_Y_A",
                "y.b": "ID_Y_B"
            }
        },
        discriminatorValue: 2
    });
});

export const ORDER_ITEM = model("OrderItem", "id", class {
    id = prop.i64();
    order = prop.m2o(ORDER).joinColumns({
        columns: [
            { columnName: "order_y_a", referencedSubPath: "y.a" },
            { columnName: "order_y_b", referencedSubPath: "y.b" },
            { columnName: "order_x", referencedSubPath: "x" },
        ],
        cascade: "DELETE"
    });
});

export const TAG = model("Tag", "id", class {
    id = prop.embedded({
        low: prop.i32(),
        high: prop.i32()
    });
    name = prop.str()
    orders = prop.m2m(ORDER).mappedBy("tags").orderBy("id.y.a", "name")
});

export const COMMENT = model("Comment", "id", class {
    id = prop.i64()
    name = prop.str()
});

export const STUDENT = model("Student", "id", class {
    id = prop.i64()
    name = prop.str()
    courses = prop.m2m(COURSE).joinEntity({
        model: LEARNING_LINK,
        joinThisProp: "student",
        joinTargetProp: "course"
    })
    // With learningLinks
    learningLinks = prop.o2m(LEARNING_LINK).mappedBy("student")
});

export const COURSE = model("Course", "id", class {
    id = prop.i64()
    name = prop.str()
    students = prop.m2m(STUDENT).mappedBy("courses")
    // Without learningLinks
});

export const LEARNING_LINK = model("LearningLink", "id", class {
    id = prop.i64()
    score = prop.i16().nullable()
    student = prop.m2o(STUDENT)
    course = prop.m2o(COURSE)
});
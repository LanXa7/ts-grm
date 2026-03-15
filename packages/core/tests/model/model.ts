import { DV_MODEL_NAME, model } from "@/schema/model";
import { prop } from "@/schema/prop";

export const BOOK_STORE = model("BookStore", "id", class {
    id = prop.i64().asString()
    name = prop.str()
    version = prop.i32()
    books = prop.o2m(BOOK)
        .mappedBy("store")
        .orderBy("name", { path: "edition", desc: true })
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

export const AUTHOR = model("Author", "id", class {
    id = prop.i64()
    name = prop.embedded({
        firstName: prop.str(),
        lastName: prop.str()
    })
    books = prop.m2m(BOOK).mappedBy("authors");
}, ctx => ctx.unique("name.firstName", "name.lastName"));

export const TREE_NODE = model("TreeNode", "id", class {
    id = prop.i64()
    name = prop.str()
    parentNode = prop.m2o(() => TREE_NODE).nullable()
    childNodes = prop.o2m(() => TREE_NODE).mappedBy("parentNode");
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
    name = prop.num()
    tags = prop.m2m(TAG).joinTable({
        joinThis: {
            referencedProp: "id",
            columns: [
                {columnName: "order_x", referencedSubPath: "x"},
                {columnName: "order_y_a", referencedSubPath: "y.a"},
                {columnName: "order_y_b", referencedSubPath: "y.b"}
            ]
        },
        joinTarget: {
            referencedProp: "id",
            columns: [
                {columnName: "tag_low", referencedSubPath: "low"},
                {columnName: "tag_high", referencedSubPath: "high"}
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
});

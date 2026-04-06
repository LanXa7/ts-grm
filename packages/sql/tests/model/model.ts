import {DV_ABSTRACT, DV_MODEL_NAME, model, prop, TB_INHERIT} from "@ts-grm/core";

export const BOOK_STORE = model(
    "BookStore", 
    "id", 
    class {
        id = prop.i64().asString()
        name = prop.str()
        version = prop.i32()
        books = prop.o2m(BOOK).mappedBy("store")
            .orderBy("name", { path: "edition", desc: true })
    },
    ctx => {
        ctx.table({
            discriminator: "TYPE",
            discriminatorValue: DV_ABSTRACT
        });
    }
);

export const PHYSICAL_BOOK_STORE = model.extends(BOOK_STORE)(
    "PhysicalBookStore", 
    class {
        city = prop.str();
        street = prop.str();
    },
    ctx => ctx.table({
        name: TB_INHERIT,
        discriminatorValue: DV_MODEL_NAME
    })
);

export const ONLINE_BOOK_STORE = model.extends(BOOK_STORE)(
    "OnlineBookStore", 
    class {
        url = prop.str()
    },
    ctx => ctx.table({
        name: TB_INHERIT,
        discriminatorValue: DV_MODEL_NAME
    })
);

export const BOOK = model("Book", "id", 
    class {
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
    }, 
    ctx => {
        ctx.table({
            discriminator: "TYPE",
            discriminatorValue: DV_MODEL_NAME
        });
    }
);

export const PAPER_BOOK = model.extends(BOOK)(
    "PaperBook", 
    class {
        size = prop.embedded({
            width: prop.i32(),
            height: prop.i32()
        })
    },
    ctx => {
        ctx.table({
            discriminator: "PB_TYPE",
            discriminatorValue: DV_MODEL_NAME,
            name: {
                idMapping: "PB_ID"
            },
        });
    }
);

export const ELECTRONIC_BOOK = model.extends(BOOK)(
    "ElectronicBook", 
    class {
        address = prop.str();
    },
    ctx => {
        ctx.table({
            discriminator: "EB_TYPE",
            discriminatorValue: DV_MODEL_NAME,
            name: {
                idMapping: "EB_ID"
            },
        });
    }
);

export const PDF_ELECTRONIC_BOOK = model.extends(ELECTRONIC_BOOK)(
    "PdfElectronicBook",
    class {
        pdfVersion = prop.str().nullable()
    },
    ctx => {
        ctx.table({
            discriminator: "PEB_TYPE",
            discriminatorValue: DV_MODEL_NAME,
            name: {
                idMapping: "PEB_ID"
            },
        });
    }
);

export const AUTHOR = model("Author", "id", class {
    id = prop.i64()
    name = prop.embedded({
        firstName: prop.str(),
        lastName: prop.str()
    })
    books = prop.m2m(BOOK).mappedBy("authors");
});

export const TREE_NODE = model(
    "TreeNode", 
    "id", 
        class {
        id = prop.i64()
        name = prop.str()
        parentNode = prop.m2o.self(() => TREE_NODE)
        childNodes = prop.o2m.self(() => TREE_NODE, { mappedBy: "parentNode" })
    },
    ctx => {
        ctx.table({
            discriminator: "TYPE",
            discriminatorValue: DV_ABSTRACT
        })
    }
);

export const ORGANIZATION = model.extends(TREE_NODE)(
    "Organization",
    class {
        location = prop.str();
        kind = prop.str();
    },
    ctx => {
        ctx.table({
            discriminatorValue: DV_MODEL_NAME
        });
    }
)

export const GROUP = model.extends(TREE_NODE)(
    "Group",
    class {
        email = prop.str()
    },
    ctx => {
        ctx.table({
            discriminatorValue: DV_MODEL_NAME
        });
    }
);

export const ORDER = model("Order", "id", class {
    id = prop.embedded({
        x: prop.i32(),
        y: prop.embedded({
            a: prop.i16(),
            b: prop.i16()
        })
    });
    name = prop.str()
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
    })
});

export const ORDER_ITEM = model("OrderItem", "id", class {
    id = prop.i64()
    order = prop.m2o(ORDER)
    .joinColumns({
        columns: [
            { columnName: "order_x", referencedSubPath: "x" },
            { columnName: "order_y_a", referencedSubPath: "y.a" },
            { columnName: "order_y_b", referencedSubPath: "y.b" }
        ],
        cascade: "DELETE"
    })
});

export const TAG = model("Tag", "id", class {
    id = prop.embedded({
        low: prop.i32(),
        high: prop.i32()
    });
    name = prop.str()
    orders = prop.m2m(ORDER).mappedBy("tags")
});

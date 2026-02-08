import { AbstractCmpExpr } from "./expr";
import { LikePred } from "./pred";
import { AbstractNumExpr } from "./num_expr";
import { LikeMode } from "@/dsl";
import { ArgumentError } from "@/error/common";
import { getInternalFactory } from "./internal_factory";
import type { CoalesceStrExpr } from "./coalesce_expr";

export class AbstractStrExpr extends AbstractCmpExpr<string> {

    __type(): { 
        selectionLike: true;
        expressionLike: true;
        expression: string | undefined;
        cmpExpression: string | undefined;
        strExpression: string | undefined;
    } {
        return {
            selectionLike: true,
            expressionLike: true,
            expression: undefined,
            cmpExpression: undefined,
            strExpression: undefined
        };
    }

    like(
        value: string, 
        mode?: LikeMode
    ): LikePred | undefined {
        const finalMode = mode ?? "CONTAINS";
        if (value === "" && finalMode === "CONTAINS") {
            return undefined;
        }
        return new LikePred(this, value, finalMode, false);
    };

    ilike(
        value: string, 
        mode?: LikeMode
    ): LikePred | undefined {
        const finalMode = mode ?? "CONTAINS";
        if (value === "" && finalMode === "CONTAINS") {
            return undefined;
        }
        return new LikePred(this, value, finalMode, true);
    }

    likeIf(
        value: string | null | undefined, 
        mode?: LikeMode
    ): LikePred | undefined {
        if (value == null) {
            return undefined;
        }
        const finalMode = mode ?? "CONTAINS";
        if (value === "" && finalMode === "CONTAINS") {
            return undefined;
        }
        return new LikePred(this, value, finalMode, false);
    }

    ilikeIf(
        value: string | null | undefined, 
        mode?: LikeMode
    ): LikePred | undefined {
        if (value == null) {
            return undefined;
        }
        const finalMode = mode ?? "CONTAINS";
        if (value === "" && finalMode === "CONTAINS") {
            return undefined;
        }
        return new LikePred(this, value, finalMode, true);
    }

    lower(): LowerExpr {
        return new LowerExpr(this);
    }

    upper(): UpperExpr {
        return new UpperExpr(this);
    }

    trim(): TrimExpr {
        return new TrimExpr(this, undefined);
    }

    ltrim(): TrimExpr {
        return new TrimExpr(this, "LEFT");
    }

    rtrim(): TrimExpr {
        return new TrimExpr(this, "RIGHT");
    }

    length(): LengthExpr {
        return new LengthExpr(this);
    }

    reverse(): ReverseExpr {
        return new ReverseExpr(this);
    }

    replace(oldStr: string, newStr: string): ReplaceExpr {
        const factory = getInternalFactory();
        return new ReplaceExpr(this, factory.createLiteral(oldStr), factory.createLiteral(newStr));
    }

    lpad(
        length: number | AbstractNumExpr<number>, 
        pad?: string
    ): PadExpr {
        const factory = getInternalFactory();
        return new PadExpr(
            this, 
            typeof length === "number" ? factory.createLiteral(length) : length, 
            pad != null ? factory.createLiteral(pad) : undefined, 
            "LEFT"
        );
    }

    rpad(
        length: number | AbstractNumExpr<number>, 
        pad?: string
    ): PadExpr {
        const factory = getInternalFactory();
        return new PadExpr(
            this, 
            typeof length === "number" ? factory.createLiteral(length) : length, 
            pad != null ? factory.createLiteral(pad) : undefined, 
            "RIGHT"
        );
    }

    left(
        length: number | AbstractNumExpr<number>
    ): LeftExpr {
        return new LeftExpr(
            this, 
            typeof length === "number" ? getInternalFactory().createLiteral(length) : length
        );
    }

    right(
        length: number | AbstractNumExpr<number>
    ): RightExpr {
        return new RightExpr(
            this, 
            typeof length === "number" ? getInternalFactory().createLiteral(length) : length
        );
    }

    position(
        substr: string, 
        start?: number | AbstractNumExpr<number>
    ): PositionExpr {
        const factory = getInternalFactory();
        return new PositionExpr(
            this,
            factory.createLiteral(substr),
            start != null 
                ? typeof start === "number" ? factory.createLiteral(start) : start
                : undefined
        );
    }

    substring(
        start: number | AbstractNumExpr<number>,
        length?: number |AbstractNumExpr<number>
    ): SubstringExpr {
        const factory = getInternalFactory();
        return new SubstringExpr(
            this,
            typeof start === "number" ? factory.createLiteral(start) : start,
            length != null
                ? typeof length === "number" ? factory.createLiteral(length) : length
                : undefined
        );
    }

    override coalesce(
        values: ReadonlyArray<string | AbstractStrExpr>
    ): CoalesceStrExpr {
        const factory = getInternalFactory();
        const arr = values.map(value => {
            if (value == null) {
                throw new ArgumentError("coalesce does not accept null/undefined value");
            }
            if (value instanceof AbstractStrExpr) {
                return value;
            }
            return factory.createLiteral(value);
        });
        return factory.createCoalesceStrExpr(this, arr);
    }
}

class LowerExpr extends AbstractStrExpr {

    constructor(readonly expr: AbstractStrExpr) {
        super();
    }
}

class UpperExpr extends AbstractStrExpr {

    constructor(readonly expr: AbstractStrExpr) {
        super();
    }
}

class ReverseExpr extends AbstractStrExpr {

    constructor(readonly expr: AbstractStrExpr) {
        super();
    }
}

class TrimExpr extends AbstractStrExpr {

    constructor(
        readonly expr: AbstractStrExpr,
        readonly side: "LEFT" | "RIGHT" | undefined
    ) {
        super();
    }
}

class LengthExpr extends AbstractNumExpr<number> {

    constructor(readonly expr: AbstractStrExpr) {
        super();
    }
}

class ReplaceExpr extends AbstractStrExpr {

    constructor(
        readonly expr: AbstractStrExpr,
        readonly oldStrExpr: AbstractStrExpr,
        readonly newStrExpr: AbstractStrExpr
    ) {
        super();
    }
}

class PadExpr extends AbstractStrExpr {

    constructor(
        readonly expr: AbstractStrExpr,
        readonly lenExpr: AbstractNumExpr<number>,
        readonly padExpr: AbstractStrExpr | undefined,
        readonly side: "LEFT" | "RIGHT"
    ) {
        super();
    }
}

class LeftExpr extends AbstractStrExpr {

    constructor(
        readonly expr: AbstractStrExpr,
        readonly lenExpr: AbstractNumExpr<number>
    ) {
        super();
    }
}

class RightExpr extends AbstractStrExpr {

    constructor(
        readonly expr: AbstractStrExpr,
        readonly lenExpr: AbstractNumExpr<number>
    ) {
        super();
    }
}

class PositionExpr extends AbstractStrExpr {

    constructor(
        readonly expr: AbstractStrExpr,
        readonly substrExpr: AbstractStrExpr,
        readonly startExpr: AbstractNumExpr<number> | undefined
    ) {
        super();
    }
}

class SubstringExpr extends AbstractStrExpr {

    constructor(
        readonly expr: AbstractStrExpr,
        readonly start: AbstractNumExpr<number>,
        readonly lenExpr: AbstractNumExpr<number> | undefined
    ) {
        super();
    }
}

export class ConcatExpr extends AbstractStrExpr {

    constructor(
        readonly values: ReadonlyArray<AbstractStrExpr>
    ) {
        super();
    }
}

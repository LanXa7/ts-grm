import { AbstractCmpExpr } from "./expr";
import { LikePred } from "./pred";
import { AbstractNumExpr } from "./num_expr";
import { LikeMode } from "@/dsl/expression";
import { ArgumentError } from "@/error/common";
import { getInternalFactory } from "./internal_factory";
import type { CoalesceStrExpr } from "./coalesce_expr";
import { Visitor } from "./visitor";

export abstract class AbstractStrExpr extends AbstractCmpExpr<string> {

    like(
        value: string, 
        mode?: LikeMode
    ): LikePred | undefined {
        const finalMode = mode ?? "CONTAINS";
        if (value === "" && finalMode === "CONTAINS") {
            return undefined;
        }
        return new LikePred(
            this, 
            getInternalFactory().createLiteral(likePattern(value, false, finalMode)), 
            false
        );
    };

    ilike(
        value: string, 
        mode?: LikeMode
    ): LikePred | undefined {
        const finalMode = mode ?? "CONTAINS";
        if (value === "" && finalMode === "CONTAINS") {
            return undefined;
        }
        return new LikePred(
            this, 
            getInternalFactory().createLiteral(likePattern(value, true, finalMode)), 
            true
        );
    }

    likeIf(
        value: string | null | undefined, 
        mode?: LikeMode
    ): LikePred | undefined {
        if (value == null) {
            return undefined;
        }
        return this.like(value, mode);
    }

    ilikeIf(
        value: string | null | undefined, 
        mode?: LikeMode
    ): LikePred | undefined {
        if (value == null) {
            return undefined;
        }
        return this.ilike(value, mode);
    }

    notLike(
        value: string, 
        mode?: LikeMode
    ): LikePred | undefined {
        const finalMode = mode ?? "CONTAINS";
        if (value === "" && finalMode === "CONTAINS") {
            return undefined;
        }
        return new LikePred(
            this, 
            getInternalFactory().createLiteral(likePattern(value, false, finalMode)), 
            false,
            true
        );
    };

    notIlike(
        value: string, 
        mode?: LikeMode
    ): LikePred | undefined {
        const finalMode = mode ?? "CONTAINS";
        if (value === "" && finalMode === "CONTAINS") {
            return undefined;
        }
        return new LikePred(
            this, 
            getInternalFactory().createLiteral(likePattern(value, true, finalMode)), 
            true,
            true
        );
    }

    notLikeIf(
        value: string | null | undefined, 
        mode?: LikeMode
    ): LikePred | undefined {
        if (value == null) {
            return undefined;
        }
        return this.notLike(value, mode);
    }

    notIlikeIf(
        value: string | null | undefined, 
        mode?: LikeMode
    ): LikePred | undefined {
        if (value == null) {
            return undefined;
        }
        return this.notIlike(value, mode);
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

export class LowerExpr extends AbstractStrExpr {

    constructor(readonly expr: AbstractStrExpr) {
        super();
    }

    accept(visitor: Visitor): void {
        visitor.visitLowerExpr(this);
    }
}

export class UpperExpr extends AbstractStrExpr {

    constructor(readonly expr: AbstractStrExpr) {
        super();
    }

    accept(visitor: Visitor): void {
        visitor.visitUpperExpr(this);
    }
}

export class ReverseExpr extends AbstractStrExpr {

    constructor(readonly expr: AbstractStrExpr) {
        super();
    }

    accept(visitor: Visitor): void {
        visitor.visitReverseExpr(this);
    }
}

export class TrimExpr extends AbstractStrExpr {

    constructor(
        readonly expr: AbstractStrExpr,
        readonly side: "LEFT" | "RIGHT" | undefined
    ) {
        super();
    }

    accept(visitor: Visitor): void {
        visitor.visitTrimExpr(this);
    }
}

export class LengthExpr extends AbstractNumExpr<number> {

    constructor(readonly expr: AbstractStrExpr) {
        super();
    }

    accept(visitor: Visitor): void {
        visitor.visitLengthExpr(this);
    }
}

export class ReplaceExpr extends AbstractStrExpr {

    constructor(
        readonly expr: AbstractStrExpr,
        readonly oldStrExpr: AbstractStrExpr,
        readonly newStrExpr: AbstractStrExpr
    ) {
        super();
    }

    accept(visitor: Visitor): void {
        visitor.visitReplaceExpr(this);
    }
}

export class PadExpr extends AbstractStrExpr {

    constructor(
        readonly expr: AbstractStrExpr,
        readonly lenExpr: AbstractNumExpr<number>,
        readonly padExpr: AbstractStrExpr | undefined,
        readonly side: "LEFT" | "RIGHT"
    ) {
        super();
    }

    accept(visitor: Visitor): void {
        visitor.visitPadExpr(this);
    }
}

export class LeftExpr extends AbstractStrExpr {

    constructor(
        readonly expr: AbstractStrExpr,
        readonly lenExpr: AbstractNumExpr<number>
    ) {
        super();
    }

    accept(visitor: Visitor): void {
        visitor.visitLeftExpr(this);
    }
}

export class RightExpr extends AbstractStrExpr {

    constructor(
        readonly expr: AbstractStrExpr,
        readonly lenExpr: AbstractNumExpr<number>
    ) {
        super();
    }

    accept(visitor: Visitor): void {
        visitor.visitRightExpr(this);
    }
}

export class PositionExpr extends AbstractStrExpr {

    constructor(
        readonly expr: AbstractStrExpr,
        readonly substrExpr: AbstractStrExpr,
        readonly startExpr: AbstractNumExpr<number> | undefined
    ) {
        super();
    }

    accept(visitor: Visitor): void {
        visitor.visitPositionExpr(this);
    }
}

export class SubstringExpr extends AbstractStrExpr {

    constructor(
        readonly expr: AbstractStrExpr,
        readonly startExpr: AbstractNumExpr<number>,
        readonly lenExpr: AbstractNumExpr<number> | undefined
    ) {
        super();
    }

    accept(visitor: Visitor): void {
        visitor.visitSubstringExpr(this);
    }
}

export class ConcatExpr extends AbstractStrExpr {

    constructor(
        readonly valueExprs: ReadonlyArray<AbstractStrExpr>
    ) {
        super();
    }

    accept(visitor: Visitor): void {
        visitor.visitConcatExpr(this);
    }
}

function likePattern(value: string, insensitive: boolean, mode: LikeMode): string {
    if (insensitive) {
        value = value.toLowerCase();
    }
    if (!value.startsWith("%") && (mode === "CONTAINS" || mode === "ENDS_WITH")) {
        value = `%${value}`;
    }
    if (!value.endsWith("%") && (mode === "CONTAINS" || mode === "STARTS_WITH")) {
        value = `${value}%`;
    }
    return value;
}
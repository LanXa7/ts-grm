import { Composite, Value } from "@/sql/fragment";
import { ast } from "@ts-grm/core";

export interface NodeRender {

    renderSingleColumnInCollectionPred(
        pred: SingleColumnInCollectionPred,
        ctx: NodeRenderContext
    ): void;

    renderLikePred(
        expr: ast.LikePred,
        ctx: NodeRenderContext
    ): void;

    renderReverseExpr(
        expr: ast.ReverseExpr,
        ctx: NodeRenderContext
    ): void;

    renderTrimExpr(
        expr: ast.TrimExpr, 
        ctx: NodeRenderContext
    ): void;

    renderLengthExpr(
        expr: ast.LengthExpr,
        ctx: NodeRenderContext
    ): void;

    renderPadExpr(
        expr: ast.PadExpr,
        ctx: NodeRenderContext
    ): void;

    renderLeftExpr(
        expr: ast.LeftExpr,
        ctx: NodeRenderContext
    ): void;

    renderRightExpr(
        expr: ast.RightExpr,
        ctx: NodeRenderContext
    ): void;

    renderPositionExpr(
        expr: ast.PositionExpr,
        ctx: NodeRenderContext
    ): void;

    renderSubstringExpr(
        expr: ast.SubstringExpr,
        ctx: NodeRenderContext
    ): void;

    renderDtPlusExpr(
        expr: ast.DtPlusExpr,
        ctx: NodeRenderContext
    ): void;

    renderDtDiffExpr(
        expr: ast.DtDiffExpr,
        ctx: NodeRenderContext
    ): void;
}

export interface NodeRenderContext {

    text(value: string): void;

    separator(): void;

    withComposite(composite: Composite): Disposable;

    withPrecedence(precedence: number): Disposable;

    render(node: ast.Node | Value | string): void;
}

export type SingleColumnInCollectionPred = {

    readonly neg: boolean;

    readonly expr: ast.AbstractExpr<any>;

    readonly values: ReadonlyArray<ast.AbstractExpr<any> | Value | string>;
};
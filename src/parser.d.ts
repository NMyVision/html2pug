export declare type NodeLike = (Node & ChildNode);
export interface IParserOptions {
    tabs: boolean;
    collapse: boolean;
    textElements: string[];
    recommended: boolean;
    omitPre: boolean;
}
export default class Parser {
    private options;
    static defaultValues: () => {
        tabs: boolean;
        collapse: boolean;
        textElements: string[];
        recommended: boolean;
        omitPre: boolean;
    };
    indent: string;
    NewLine: string;
    pug: Array<string | null>;
    constructor(options?: IParserOptions);
    parse(content: Element | string): string;
    protected parseNode(node: HTMLElement, level: number): string | null;
    protected writeText(source: string, indent: string, prefix: string, node?: NodeLike | null): string;
    protected setAttributes(node: Element): string;
    protected parseAndCollapse(node: NodeLike | Node, indent: string): string | null;
    protected canCollapse(node: HTMLElement): boolean;
    private childContains;
    private isTextNode;
    private isCommentNode;
    private isElementNode;
    private isDocumentTypeNode;
    private isEmptyTextNode;
    private isElementSingleTextNode;
    private isElementMultiTextNode;
    private getNodes;
    private Indent;
}

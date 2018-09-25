export interface ParserOptions {
    tabs: boolean;
    collapse: boolean;
}
export declare class Parser {
    parse(content: HTMLElement | string): string;
    private indent(level);
    private writeNode(node);
    private parseNode(node, level?);
    private mapText(line, index, arr);
    private canCollapse(leaf);
    private writeBranch(leaf, lines?, prefix?);
    private writeStick(leaf, lines?);
}

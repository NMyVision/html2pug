"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var HtmlNodeType;
(function (HtmlNodeType) {
    HtmlNodeType[HtmlNodeType["Element"] = 1] = "Element";
    HtmlNodeType[HtmlNodeType["Text"] = 3] = "Text";
    HtmlNodeType[HtmlNodeType["CData"] = 4] = "CData";
    HtmlNodeType[HtmlNodeType["Comment"] = 8] = "Comment";
    HtmlNodeType[HtmlNodeType["DocumentType"] = 10] = "DocumentType";
})(HtmlNodeType || (HtmlNodeType = {}));
class Parser {
    constructor(options = Parser.defaultValues()) {
        this.options = options;
        this.NewLine = "\n";
        this.childContains = (node, text) => node.childNodes[0] ? node.childNodes[0].nodeValue === null ? false : (node.childNodes[0].nodeValue || "").indexOf(text) > -1 : false;
        this.isTextNode = (node) => node.nodeType === HtmlNodeType.Text;
        this.isCommentNode = (node) => node.nodeType === HtmlNodeType.Comment;
        this.isElementNode = (node) => node.nodeType === HtmlNodeType.Element;
        this.isDocumentTypeNode = (node) => node.nodeType === HtmlNodeType.DocumentType;
        this.isEmptyTextNode = (node) => this.isTextNode(node) && (node.nodeValue || "").trim().length === 0;
        this.isElementSingleTextNode = (node) => node.hasChildNodes() && node.childNodes.length === 1 && this.isTextNode(node.childNodes[0]) && !this.childContains(node, this.NewLine);
        this.isElementMultiTextNode = (node) => node.hasChildNodes() && node.childNodes.length === 1 && this.isTextNode(node.childNodes[0]) && this.childContains(node, this.NewLine);
        this.getNodes = (node) => Array.from(node.childNodes).filter(child => !this.isEmptyTextNode(child));
        this.Indent = (level) => this.indent.repeat(level);
        this.pug = [];
        this.indent = this.options.tabs ? "\t" : "  ";
    }
    parse(content) {
        if (content === null) {
            return "";
        }
        let root = content;
        if (typeof content === "string") {
            root = document.createElement("fake");
            root.innerHTML = content;
        }
        const tree = this.getNodes(root);
        for (const node of tree) {
            const text = this.parseNode(node, 0);
            if (text !== null) {
                this.pug.push(text);
            }
        }
        return this.pug.join(this.NewLine);
    }
    parseNode(node, level) {
        const indent = this.indent.repeat(level);
        if (this.isDocumentTypeNode(node)) {
            return `${indent}doctype html`;
        }
        if (this.isTextNode(node)) {
            return this.writeText(node.nodeValue || "", indent, "| ", node);
        }
        if (this.isCommentNode(node)) {
            const comment = node.nodeValue || "";
            return this.writeText(comment.trim(), indent, "// ");
        }
        if (this.options.collapse && this.canCollapse(node)) {
            return this.parseAndCollapse(node, indent);
        }
        if (this.isElementNode(node)) {
            const line = [];
            const tagName = node.tagName.toLowerCase();
            if (tagName === "pre" && this.options.omitPre) {
                line.push(`${indent}${this.setAttributes(node)}`);
                line.push(this.writeText("content omitted", this.Indent(level + 1), "//- "));
                return line.join(this.NewLine);
            }
            if (this.isElementMultiTextNode(node)) {
                if (this.options.textElements.indexOf(tagName) > -1) {
                    line.push(`${indent}${this.setAttributes(node)}.`);
                    line.push(this.writeText(node.childNodes[0].nodeValue || "", this.Indent(level + 1), ""));
                    return line.join(this.NewLine);
                }
                line.push(`${indent}${this.setAttributes(node)}`);
            }
            else if (this.isElementSingleTextNode(node)) {
                const text = node.childNodes[0].nodeValue || "";
                return `${indent}${this.setAttributes(node)} ${text}`;
            }
            else {
                line.push(`${indent}${this.setAttributes(node)}`);
            }
            if (node.hasChildNodes()) {
                for (const child of this.getNodes(node)) {
                    line.push(this.parseNode(child, level + 1) || "");
                }
            }
            return line.join(this.NewLine);
        }
        else {
            return "";
        }
    }
    writeText(source, indent, prefix, node = null) {
        const text = source.split(this.NewLine).filter(x => x !== null && x.trim().length > 0);
        // if (text.length > 1) {
        let first = true;
        const multiLine = text
            .map(line => {
            const temp = [];
            if (node !== null && node.nextSibling !== null && node.nextSibling.nodeType === HtmlNodeType.Element) {
                if (this.options.recommended) {
                    temp.push(`${indent}${prefix}${line.trim()}`);
                    temp.push(`${indent}${prefix} `);
                }
                else {
                    temp.push(`${indent}${prefix}${line.trim()} `);
                }
            }
            else if (node !== null && node.previousSibling !== null && node.previousSibling.nodeType === HtmlNodeType.Element && first) {
                first = false;
                if (this.options.recommended) {
                    temp.push(`${indent}${prefix} `);
                    temp.push(`${indent}${prefix}${line.trim()}`);
                }
                else {
                    temp.push(`${indent}${prefix} ${line.trim()}`);
                }
            }
            else {
                temp.push(`${indent}${prefix}${line.trim()}`);
            }
            return temp.join(this.NewLine);
        });
        return multiLine.join(this.NewLine);
    }
    setAttributes(node) {
        const tagName = node.tagName.toLowerCase();
        const attributeList = [];
        let classes = "";
        const pugNode = [];
        pugNode.push(tagName);
        let shorten = false;
        for (const a of Array.from(node.attributes)) {
            const name = a.name;
            const value = a.value;
            switch (name) {
                case "id":
                    shorten = true;
                    break;
                case "class":
                    shorten = true;
                    classes = `.${value.split(" ").join(".")}`;
                    break;
                default:
                    attributeList.push(`${name}="${value}"`);
                    break;
            }
        }
        // Remove div tagName
        if (tagName === "div" && shorten) {
            pugNode.splice(0, 1);
        }
        if (node.id) {
            pugNode.push(`#${node.id}`);
        }
        if (classes) {
            pugNode.push(classes);
        }
        if (attributeList.length > 0) {
            pugNode.push(`(${attributeList.join(" ")})`);
        }
        return pugNode.join("");
    }
    parseAndCollapse(node, indent) {
        const result = [];
        do {
            if (this.isElementSingleTextNode(node)) {
                result.push(`${this.setAttributes(node)} ${node.firstChild ? node.firstChild.nodeValue : ""}`);
                break;
            }
            const child = node.firstChild;
            if (this.isTextNode(child) || this.isElementNode(child)) {
                if (this.isTextNode(node)) {
                    const text = (node.nodeValue || "").trim();
                    if (text.length === 0) {
                        return null;
                    }
                    result.push(text);
                }
                else if (this.isElementNode(node)) {
                    result.push(`${this.setAttributes(node)}:`);
                }
                node = Array.from(node.childNodes).filter(x => x.nodeType !== HtmlNodeType.Text)[0];
                if (node === undefined) {
                    node = child;
                }
            }
            // eslint-disable-next-line
        } while (true);
        return `${indent}${result.join(" ")}`;
    }
    canCollapse(node) {
        if (!node.hasChildNodes()) {
            return false;
        }
        if (Array.from(node.childNodes).filter(x => x.nodeType !== HtmlNodeType.Text).length > 1) {
            return false;
        }
        if (node.innerText && node.innerText.indexOf(this.NewLine) > -1) {
            return false;
        }
        for (const child of Array.from(node.childNodes).filter(x => this.isElementNode(x))) {
            if (!this.canCollapse(child)) {
                return false;
            }
        }
        return true;
    }
}
Parser.defaultValues = () => ({
    tabs: false,
    collapse: true,
    textElements: ["script", "pre"],
    recommended: false,
    omitPre: true
});
exports.default = Parser;
//# sourceMappingURL=parser.js.map
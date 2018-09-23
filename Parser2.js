"use strict";
var HtmlNodeType;
(function (HtmlNodeType) {
    HtmlNodeType[HtmlNodeType["Element"] = 1] = "Element";
    HtmlNodeType[HtmlNodeType["Text"] = 3] = "Text";
    HtmlNodeType[HtmlNodeType["CData"] = 4] = "CData";
    HtmlNodeType[HtmlNodeType["Comment"] = 8] = "Comment";
    HtmlNodeType[HtmlNodeType["DocumentType"] = 10] = "DocumentType";
})(HtmlNodeType || (HtmlNodeType = {}));
class Parser {
    constructor() {
        this.childContains = (node, text) => node.childNodes[0] ? node.childNodes[0].nodeValue === null ? false : (node.childNodes[0].nodeValue || "").indexOf(text) > -1 : false;
        this.isTextNode = (node) => node.nodeType === HtmlNodeType.Text;
        this.isCommentNode = (node) => node.nodeType === HtmlNodeType.Comment;
        this.isElementNode = (node) => node.nodeType === HtmlNodeType.Element;
        this.isDocumentTypeNode = (node) => node.nodeType === HtmlNodeType.DocumentType;
        this.isEmptyTextNode = (node) => this.isTextNode(node) && (node.nodeValue || "").trim().length === 0;
        this.isElementSingleTextNode = (node) => node.hasChildNodes() && node.childNodes.length === 1 && this.isTextNode(node.childNodes[0]) && !this.childContains(node, this.NewLine);
        this.isElementMultiTextNode = (node) => node.hasChildNodes() && node.childNodes.length === 1 && this.isTextNode(node.childNodes[0]) && this.childContains(node, this.NewLine);
        this.getNodes = (node) => Array.from(node.childNodes).filter(child => !this.isEmptyTextNode(child));
        //private Indent = (level: number) => this.indent.repeat(level);
    }
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var HtmlNodeType;
(function (HtmlNodeType) {
    HtmlNodeType[HtmlNodeType["Element"] = 1] = "Element";
    HtmlNodeType[HtmlNodeType["Text"] = 3] = "Text";
    HtmlNodeType[HtmlNodeType["CData"] = 4] = "CData";
    HtmlNodeType[HtmlNodeType["Comment"] = 8] = "Comment";
    HtmlNodeType[HtmlNodeType["Document"] = 9] = "Document";
    HtmlNodeType[HtmlNodeType["DocumentType"] = 10] = "DocumentType";
})(HtmlNodeType || (HtmlNodeType = {}));
class Parser {
    parse(content) {
        debugger;
        if (content === null) {
            return "";
        }
        let children = null;
        const parser = new DOMParser();
        if (typeof content === "string") {
            children = parser.parseFromString(content, "text/html");
        }
        else {
            children = parser.parseFromString(content.outerHTML, "text/html");
        }
        const tree = Array.from(children.childNodes).map(x => this.parseNode(x, undefined));
        let results = [];
        //if (tree.nodeType === HtmlNodeType.DocumentType)
        //  results.push(`doctype html`);
        results.concat(...tree.filter(x => x !== null).map(x => this.writeBranch(x, results)));
        return results.join("\n");
    }
    indent(level) { return "..".repeat(level); }
    writeNode(node) {
        const tagName = node.tagName.toLowerCase();
        const attributeList = [];
        const pugNode = [];
        let classes = "";
        let shorten = false;
        pugNode.push(tagName);
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
    parseNode(node, level = 0) {
        if (node === null)
            return null;
        let tagName = node.localName || "";
        if (node.nodeType === HtmlNodeType.DocumentType) {
            var p0 = {
                pug: `doctype ${node.nodeName}`,
                type: node.nodeType,
                tag: tagName,
                text: [],
                children: [],
                hasChildren: false,
                oneChild: false,
                firstChildType: null,
                level: 0
            };
            return p0;
        }
        else if (node.nodeType === HtmlNodeType.Document) {
            var p0 = {
                pug: `${node.localName}`,
                type: node.nodeType,
                tag: tagName,
                text: [],
                children: [],
                hasChildren: false,
                oneChild: false,
                firstChildType: null,
                level: 0
            };
            return p0;
        }
        else if (node.nodeType === HtmlNodeType.Element) {
            var c = node.hasChildNodes()
                ? Array.from(node.childNodes)
                    .map(n => this.parseNode(n, level + 1))
                    .filter(x => x !== null)
                : [];
            var hc = c.length > 0;
            var p1 = {
                pug: this.writeNode(node),
                type: node.nodeType,
                tag: tagName,
                text: [],
                children: c,
                hasChildren: hc,
                oneChild: hc ? c.length === 1 : false,
                firstChildType: hc ? c[0].type : null,
                level: level
            };
            return p1;
        }
        else if (node.nodeType === HtmlNodeType.Text || node.nodeType === HtmlNodeType.Comment) {
            if (!node.nodeValue || node.nodeValue.trim().length === 0)
                return null;
            var lines = node.nodeValue
                .split("\n")
                .map(this.mapText)
                .filter(x => x.length > 0);
            if (lines.length > 1 && lines[0].line.trim().length === 0) {
                // clean up empty first lines combine with the second line
                lines[1].line = " " + lines[1].line;
                lines.splice(0, 1);
            }
            var p2 = {
                //pug: null,
                type: node.nodeType,
                //tag: null,
                text: lines.filter(x => x.line.length > 0),
                children: [],
                hasChildren: false,
                //firstChildType: null,
                level: level
            };
            return p2;
        }
        return null;
    }
    mapText(line, index, arr) {
        var len = arr.length;
        var x = {
            length: line.length,
            raw: `[${line.replace(/\t/g, "*").replace(/ /g, ".")}]`,
            line: "",
            isFirst: index === 0,
            isLast: index === len - 1,
            isOnly: len === 1,
            spaceStart: line.indexOf(" ") === 0,
            spaceEnd: line.lastIndexOf(" ") === line.length - 1
        };
        x.line = [x.spaceStart ? " " : "", line.trim(), x.spaceEnd ? " " : ""].join("");
        return x;
    }
    canCollapse(leaf) {
        if (leaf.type === HtmlNodeType.Comment ||
            (leaf.type === HtmlNodeType.Text && leaf.text.length > 1) ||
            (leaf.type !== HtmlNodeType.Text && !leaf.oneChild))
            return false;
        return leaf.children.every(x => this.canCollapse(x));
    }
    writeBranch(leaf, lines = [], prefix = "") {
        console.log(leaf);
        if (leaf.type === HtmlNodeType.DocumentType) {
            lines.push(leaf.pug);
        }
        else if (this.canCollapse(leaf) && leaf.type !== HtmlNodeType.Text) {
            var line = this.writeStick(leaf).join(" ");
            lines.push(`${this.indent(leaf.level)}${line}`);
        }
        else {
            if (leaf.type === HtmlNodeType.Element) {
                let root = `${this.indent(leaf.level)}${leaf.pug}`;
                if (leaf.oneChild && leaf.firstChildType === HtmlNodeType.Text) {
                    if (leaf.children[0].text[0].isOnly)
                        lines.push(`${root} ${leaf.children[0].text[0].line}`);
                    else {
                        lines.push(`${root}.`);
                        leaf.children.forEach(c => this.writeBranch(c, lines, ""));
                    }
                }
                else {
                    lines.push(`${root}`);
                    leaf.children.forEach(c => this.writeBranch(c, lines, "| "));
                }
            }
            else if (leaf.type === HtmlNodeType.Text) {
                lines.push(...leaf.text.map(c => `${this.indent(leaf.level)}${prefix}${c.line}`));
            }
            else if (leaf.type === HtmlNodeType.Comment) {
                let root = `${this.indent(leaf.level)}//`;
                if (leaf.text[0].isOnly)
                    lines.push(`${root} ${leaf.text[0].line.trim()}`);
                else {
                    lines.push(`${root}`);
                    lines.push(...leaf.text.map(c => `${this.indent(leaf.level + 1)}${c.line.trim()}`));
                }
            }
        }
        return lines;
    }
    writeStick(leaf, lines = []) {
        if (leaf.type === HtmlNodeType.Element) {
            var temp = leaf.pug;
            if (leaf.firstChildType !== HtmlNodeType.Text)
                temp += ":";
            lines.push(temp);
            leaf.children.forEach(c => this.writeStick(c, lines));
        }
        else if (leaf.type === HtmlNodeType.Text) {
            lines.push(...leaf.text.map(c => `${c.line}`));
        }
        return lines;
    }
}
exports.Parser = Parser;
//# sourceMappingURL=parser.js.map
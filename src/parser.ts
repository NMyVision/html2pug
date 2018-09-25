
type NodeLike = (Node & ChildNode)

enum HtmlNodeType {
  Element = 1,
  Text = 3,
  CData = 4,
  Comment = 8,
  Document = 9,
  DocumentType = 10
}

export interface ParserOptions {
  tabs: boolean;
  collapse: boolean;
  //textElements: string[];
  //recommended: boolean;
  //omitPre: boolean;
}
interface ILine {
  length: number;
  raw: string;
  line: string;
  isFirst: boolean;
  isLast: boolean;
  isOnly: boolean;
  spaceStart: boolean;
  spaceEnd: boolean;
}
interface ITextNode {
  //pug: string;
  type: HtmlNodeType.Comment | HtmlNodeType.Text;
  //tag: string;
  text: ILine[];
  children: [];
  hasChildren: boolean;
  //oneChild: boolean;
  //firstChildType: boolean;
  level: number;
}

interface IElementNode {
  pug: string;
  type: HtmlNodeType;
  tag: string;
  text: ILine[];
  children: (ITextNode | IElementNode | null)[];
  hasChildren: boolean;
  oneChild: boolean;
  firstChildType: number | null;
  level: number;
}

export default class Parser {



  public parse(content: HTMLElement | string) {
    debugger;
    if (content === null) {
      return "";
    }

    let children: (Document | null) = null;

    const parser = new DOMParser();

    if (typeof content === "string") {
      children = parser.parseFromString(content, "text/html")
    } else {
      children = parser.parseFromString(content.outerHTML, "text/html")
    }

    const tree = Array.from(children.childNodes).map(x => this.parseNode(x, undefined));

    let results: string[] = []

    //if (tree.nodeType === HtmlNodeType.DocumentType)
    //  results.push(`doctype html`);

    results.concat(...tree.filter(x => x !== null).map(x => this.writeBranch(x, results)))

    return results.join("\n")
  }

  private indent(level:number) { return "..".repeat(level) }

  private writeNode(node: HTMLElement) {
    const tagName = node.tagName.toLowerCase()
    const attributeList: string[] = []
    const pugNode: string[] = []
    let classes = ""
    let shorten = false
    pugNode.push(tagName)
    for (const a of Array.from(node.attributes)) {
      const name = a.name
      const value = a.value
      switch (name) {
        case "id":
          shorten = true
          break
        case "class":
          shorten = true
          classes = `.${value.split(" ").join(".")}`
          break
        default:
          attributeList.push(`${name}="${value}"`)
          break
      }
    }
    // Remove div tagName
    if (tagName === "div" && shorten) {
      pugNode.splice(0, 1)
    }
    if (node.id) {
      pugNode.push(`#${node.id}`)
    }
    if (classes) {
      pugNode.push(classes)
    }
    if (attributeList.length > 0) {
      pugNode.push(`(${attributeList.join(" ")})`)
    }
    return pugNode.join("")
  }

  private parseNode(node: Document | NodeLike, level: number = 0) { //element

    if (node === null) return null
    let tagName: string = node.localName || ""
    if (node.nodeType === HtmlNodeType.DocumentType) {
      var p0: IElementNode = {
        pug: `doctype ${node.nodeName}`,
        type: node.nodeType,
        tag: tagName,
        text: [],
        children: [],
        hasChildren: false,
        oneChild: false,
        firstChildType: null,
        level: 0
      }
      return p0
    }
    else if (node.nodeType === HtmlNodeType.Document) {
      var p0: IElementNode = {
        pug: `${node.localName}`,
        type: node.nodeType,
        tag: tagName,
        text: [],
        children: [],
        hasChildren: false,
        oneChild: false,
        firstChildType: null,
        level: 0
      }
      return p0
    }
    else if (node.nodeType === HtmlNodeType.Element) {
      var c = node.hasChildNodes()
        ? Array.from(node.childNodes)
          .map(n => this.parseNode(n as NodeLike, level + 1))
          .filter(x => x !== null)
        : []
      var hc = c.length > 0
      var p1: IElementNode = {
        pug: this.writeNode(node as HTMLElement),
        type: node.nodeType,
        tag: tagName,
        text: [],
        children: c,
        hasChildren: hc,
        oneChild: hc ? c.length === 1 : false,
        firstChildType: hc ? (c[0] as any).type : null,
        level: level
      }
      return p1
    } else if (node.nodeType === HtmlNodeType.Text || node.nodeType === HtmlNodeType.Comment) { //text or Comment
      if (!node.nodeValue || node.nodeValue.trim().length === 0) return null

      var lines = node.nodeValue
        .split("\n")
        .map(this.mapText)
        .filter(x => x.length > 0)

      if (lines.length > 1 && lines[0].line.trim().length === 0) {
        // clean up empty first lines combine with the second line
        lines[1].line = " " + lines[1].line
        lines.splice(0, 1)
      }

      var p2: ITextNode = {
        //pug: null,
        type: node.nodeType,
        //tag: null,
        text: lines.filter(x => x.line.length > 0),
        children: [],
        hasChildren: false,
        //firstChildType: null,
        level: level
      }
      return p2
    }
    return null
  }

  private mapText(line: string, index: number, arr: string[]) {
    var len = arr.length
    var x = {
      length: line.length,
      raw: `[${line.replace(/\t/g, "*").replace(/ /g, ".")}]`,
      line: "",
      isFirst: index === 0,
      isLast: index === len - 1,
      isOnly: len === 1,
      spaceStart: line.indexOf(" ") === 0,
      spaceEnd: line.lastIndexOf(" ") === line.length - 1
    }

    x.line = [x.spaceStart ? " " : "", line.trim(), x.spaceEnd ? " " : ""].join("")

    return x
  }

  private canCollapse(leaf) {

    if (leaf.type === HtmlNodeType.Comment ||
      (leaf.type === HtmlNodeType.Text && leaf.text.length > 1) ||
      (leaf.type !== HtmlNodeType.Text && !leaf.oneChild)) return false

    return leaf.children.every(x => this.canCollapse(x))
  }

  private writeBranch(leaf, lines: string[] = [], prefix = "") {
    console.log(leaf)
    if (leaf.type === HtmlNodeType.DocumentType) {
      lines.push(leaf.pug)
    }
    else if (this.canCollapse(leaf) && leaf.type !== HtmlNodeType.Text) {
      var line = this.writeStick(leaf).join(" ")
      lines.push(`${this.indent(leaf.level)}${line}`)
    } else {
      if (leaf.type === HtmlNodeType.Element) {
        let root = `${this.indent(leaf.level)}${leaf.pug}`
        if (leaf.oneChild && leaf.firstChildType === HtmlNodeType.Text) {
          if (leaf.children[0].text[0].isOnly)
            lines.push(`${root} ${leaf.children[0].text[0].line}`)
          else {
            lines.push(`${root}.`)
            leaf.children.forEach(c => this.writeBranch(c, lines, ""))
          }
        }
        else {
          lines.push(`${root}`)
          leaf.children.forEach(c => this.writeBranch(c, lines, "| "))
        }
      } else if (leaf.type === HtmlNodeType.Text) {
        lines.push(...leaf.text.map(c => `${this.indent(leaf.level)}${prefix}${c.line}`))
      } else if (leaf.type === HtmlNodeType.Comment) {
        let root = `${this.indent(leaf.level)}//`
        if (leaf.text[0].isOnly)
          lines.push(`${root} ${leaf.text[0].line.trim()}`)
        else {
          lines.push(`${root}`)
          lines.push(...leaf.text.map(c => `${this.indent(leaf.level + 1)}${c.line.trim()}`))
        }
      }
    }
    return lines
  }

  private writeStick(leaf, lines: string[] = []) {
    if (leaf.type === HtmlNodeType.Element) {
      var temp = leaf.pug
      if (leaf.firstChildType !== HtmlNodeType.Text) temp += ":"
      lines.push(temp)
      leaf.children.forEach(c => this.writeStick(c, lines))
    } else if (leaf.type === HtmlNodeType.Text) {
      lines.push(...leaf.text.map(c => `${c.line}`))
    }
    return lines
  }

}

export type NodeLike = (Node & ChildNode)

enum HtmlNodeType {
  Element = 1,
  Text = 3,
  CData = 4,
  Comment = 8,
  DocumentType = 10
}

export interface IParserOptions {
  tabs: boolean;
  collapse: boolean;
  textElements: string[];
  recommended: boolean;
  omitPre: boolean;
}

export default class Parser {

  public static defaultValues = () => ({
    tabs: false,
    collapse: true,
    textElements: ["script", "pre"],
    recommended: false,
    omitPre: true
  })
  public indent: string
  public NewLine: string = "\n"
  public pug: Array<string | null>

  constructor(private options: IParserOptions = Parser.defaultValues()) {
    this.pug = []
    this.indent = this.options.tabs ? "\t" : "  "
  }


  public parse(content: Element | string) {
    
    if (content === null) {
      return "";
    }

    let root = content as Element;

    if (typeof content === "string") {
      root = document.createElement("fake")
      root.innerHTML = content
    }

    const tree = this.getNodes(root);

    for (const node of tree) {

      const text = this.parseNode(node as HTMLElement, 0);

      if (text !== null) { this.pug.push(text); }
    }

    return this.pug.join(this.NewLine);
  }


  protected parseNode(node: HTMLElement, level: number) {

    const indent = this.indent.repeat(level)

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

    if (this.options.collapse && this.canCollapse(node as HTMLElement)) {
      return this.parseAndCollapse(node, indent);
    }


    if (this.isElementNode(node)) {

      const line: string[] = [];
      const tagName = node.tagName.toLowerCase()

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

        line.push(`${indent}${this.setAttributes(node as Element)}`);

      }
      else if (this.isElementSingleTextNode(node)) {
        const text = node.childNodes[0].nodeValue || ""
        return `${indent}${this.setAttributes(node as Element)} ${text}`;
      }
      else {
        line.push(`${indent}${this.setAttributes(node as Element)}`);
      }

      if (node.hasChildNodes()) {
        for (const child of this.getNodes(node)) {
          line.push(this.parseNode(child as HTMLElement, level + 1) || "");
        }
      }

      return line.join(this.NewLine);

    }
    else {
      return "";

    }
  }

  protected writeText(source: string, indent: string, prefix: string, node: NodeLike | null = null) {
    const text: string[] = source.split(this.NewLine).filter(x => x !== null && x.trim().length > 0);
    // if (text.length > 1) {
    let first = true;
    const multiLine = text
      .map(line => {
        const temp: string[] = [];

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
          } else { temp.push(`${indent}${prefix} ${line.trim()}`); }
        }
        else {

          temp.push(`${indent}${prefix}${line.trim()}`);

        }

        return temp.join(this.NewLine);
      });


    return multiLine.join(this.NewLine);
  }


  protected setAttributes(node: Element) {
    const tagName = node.tagName.toLowerCase();
    const attributeList: string[] = []
    let classes = ""

    const pugNode: string[] = []

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

    if (node.id) { pugNode.push(`#${node.id}`); }
    if (classes) { pugNode.push(classes); }
    if (attributeList.length > 0) { pugNode.push(`(${attributeList.join(" ")})`); }

    return pugNode.join("");
  }

  protected parseAndCollapse(node: NodeLike | Node, indent: string) {
    const result: string[] = [];

    do {
      if (this.isElementSingleTextNode(node)) {
        result.push(`${this.setAttributes(node as Element)} ${node.firstChild ? node.firstChild.nodeValue : ""}`);
        break;
      }

      const child = node.firstChild as NodeLike;

      if (this.isTextNode(child) || this.isElementNode(child)) {
        if (this.isTextNode(node)) {
          const text = (node.nodeValue || "").trim();

          if (text.length === 0) { return null; }

          result.push(text);
        }
        else if (this.isElementNode(node)) {
          result.push(`${this.setAttributes(node as Element)}:`);
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

  protected canCollapse(node: HTMLElement) {
    if (!node.hasChildNodes()) { return false; }

    if (Array.from(node.childNodes).filter(x => x.nodeType !== HtmlNodeType.Text).length > 1) {
      return false;
    }

    if (node.innerText && node.innerText.indexOf(this.NewLine) > -1) {
      return false;
    }

    for (const child of Array.from(node.childNodes).filter(x => this.isElementNode(x))) {
      if (!this.canCollapse(child as HTMLElement)) {
        return false;
      }
    }

    return true;
  }

  private childContains = (node: NodeLike | Node, text: string) => node.childNodes[0] ? node.childNodes[0].nodeValue === null ? false : (node.childNodes[0].nodeValue || "").indexOf(text) > -1 : false
  private isTextNode = (node: NodeLike | Node) => node.nodeType === HtmlNodeType.Text
  private isCommentNode = (node: NodeLike | Node) => node.nodeType === HtmlNodeType.Comment
  private isElementNode = (node: NodeLike | Node) => node.nodeType === HtmlNodeType.Element
  private isDocumentTypeNode = (node: NodeLike | Node) => node.nodeType === HtmlNodeType.DocumentType
  private isEmptyTextNode = (node: NodeLike | Node) => this.isTextNode(node) && (node.nodeValue || "").trim().length === 0;
  private isElementSingleTextNode = (node: NodeLike | Node) => node.hasChildNodes() && node.childNodes.length === 1 && this.isTextNode(node.childNodes[0]) && !this.childContains(node, this.NewLine);
  private isElementMultiTextNode = (node: NodeLike | Node) => node.hasChildNodes() && node.childNodes.length === 1 && this.isTextNode(node.childNodes[0]) && this.childContains(node, this.NewLine);

  private getNodes = (node: NodeLike) => Array.from(node.childNodes).filter(child => !this.isEmptyTextNode(child));
  private Indent = (level: number) => this.indent.repeat(level);
}
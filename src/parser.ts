/**
 * Defines all the options for html2pug.
 */
interface IOptions {
  caseSensitive: boolean;
  collapseBooleanAttributes: boolean;
  collapseWhitespace: boolean;
  commas: boolean;
  doubleQuotes: boolean;
  fragment: boolean;
  preserveLineBreaks: boolean;
  removeEmptyAttributes: boolean;
  tabs: boolean;
}

// Default options for html2pug.
export const defaultOptions = {
  caseSensitive: true,
  collapseBooleanAttributes: true,
  collapseWhitespace: true,
  commas: false,
  doubleQuotes: true,
  fragment: false,
  preserveLineBreaks: true,
  removeEmptyAttributes: true,
  tabs: false,
};

type StringArray = Array<string | null>

type NodeLike = (Node & ChildNode)

enum HtmlNodeType {
  Element = 1,
  Text = 3,
  CData = 4,
  Comment = 8,
  Document = 9,
  DocumentType = 10
}

export class Parser {

  tab: string;
  quote: string;
  space: string;

  constructor(public options: IOptions = defaultOptions) {
    this.tab = this.options.tabs ? '\t' : '..'
    this.quote = this.options.doubleQuotes ? `"` : `'`
    this.space = this.options.commas ? `, ` : ` `
  }

  public parse(content: HTMLElement | string) {

    if (content === null) {
      return "";

    } if (typeof content === 'string') {
      const fragment = this.parseHTML(content)
      const sb: StringArray = []
      this.parseNodes(Array.from(fragment.childNodes), sb);
      return sb.join("\n")
    }

    return this.createMarkup(content)
  }

  private parseNodes(children: NodeLike[], sb: StringArray, depth: number = 0) {
    let text
    if (children.length) {
      for (var child of children) {
        text = this.createMarkup(child as HTMLElement, depth)
        if (text != null) sb.push(text);
      }
    }
  }

  private createMarkup(el: HTMLElement, depth: number = 0): string | null {
    // console.group(">", el.tagName || '#TEXT', el.nodeType, depth)
    const sb: StringArray = []

    if (el.nodeType === HtmlNodeType.Text) {
      this.createText(sb, el, depth);
    }
    else if (el.nodeType === HtmlNodeType.DocumentType) {
      sb.push('doctype html')
    }
    else {
      this.createElement(sb, el, depth);
    }

    if (el.nodeType !== HtmlNodeType.Text) {
      const children = this.activeChildNodes(el)
      this.parseNodes(children, sb, depth + 1);
    }
    // console.groupEnd();

    return (sb.length === 0) ? null : sb.join("\n")

  }

  private createText(sb: StringArray, node: NodeLike, depth: number, indent: boolean = true, prefix: string = '|') {
    const text = node.textContent
    if (text === null || text.trim().length === 0) {
      // console.log(":: createText SKIPPED")
      return
    }
    // console.log(":: createText", node.textContent?.trim()?.length)
    if (text.indexOf('\n') !== -1) {
      sb.push("")

      var segments = text.trim().split('\r\n')

      for (var segment in segments) {
        sb.push(`${this.indent(depth)}| ${segment}`)
      }
    }
    else {
      if (indent)
        sb.push(`${this.indent(depth)}| ${text}`)
      else
        sb.push(` ${text}`)
    }
  }

  private createElement(sb: StringArray, node: HTMLElement, depth: number) {

    const tagName = node.tagName.toLowerCase()
    const attributeList: string[] = []
    const pugNode: string[] = []
    let classes: string[] = []
    let specialClasses: string[] = []
    let shorten = false
    pugNode.push(tagName)
    for (const a of Array.from(node.attributes)) {
      const name = a.name
      const value = a.value

      if (name === "id") {
        shorten = true
      }
      else if (name === "class") {
        let c = value.split(" ")
        specialClasses = c.filter(x => /[:.\/]/.test(x))
        classes = c.filter(x => !(/[:.\/]/.test(x)))
        shorten = shorten || classes.length > 0
      }
      else {
        attributeList.push(`${name}=${this.quote}${value}${this.quote}`)
      }
    }


    // Remove div tagName
    if (tagName === "div" && shorten)
      pugNode.splice(0, 1)

    if (node.id)
      pugNode.push(`#${node.id}`)

    if (classes.length)
      pugNode.push(`.${classes.join('.')}`)

    if (specialClasses.length > 0)
      attributeList.push(`class=${this.quote}${specialClasses.join(" ")}${this.quote}`)

    if (attributeList.length > 0)
      pugNode.push(`(${attributeList.join(this.space)})`)


    if (node.hasChildNodes && node.childNodes.length === 1 && node.firstChild?.nodeType === HtmlNodeType.Text) {
      let text = node.firstChild?.textContent
      if (text !== null) {
        if (this.isMultiLine(text)) {
          const a: string[] = []
          if (node.nodeName === 'SCRIPT' || node.nodeName === 'PRE') {
            pugNode.push('.\n')
            text.split('\n').forEach((line, index) => {
              if (line.trim().length > 0 && this.options.preserveLineBreaks)
                a.push(`${this.indent(depth)} ${line}`)
            })
          } else {
            pugNode.push('\n')
            text.split('\n').forEach(line => {
              if (line.trim().length > 0)
                a.push(`${this.indent(depth + 1)}| ${line.trim()}`)
            })
          }
          pugNode.push(a.join('\n'))
        }
        else
          pugNode.push(` ${text}`)
      }
    }

    // console.log("pugNode:", pugNode)
    sb.push(`${this.indent(depth)}${pugNode.join("")}`)
  }

  private activeChildNodes(node: NodeLike): Array<NodeLike> {
    let children = Array.from(node.childNodes)

    if (node.nodeName === "TEMPLATE")
      children = Array.from((node as HTMLTemplateElement).content.childNodes)

    const hasElements = (node.nodeType === HtmlNodeType.Element && children.filter(x => x.nodeType === HtmlNodeType.Element).length)

    let results = hasElements ?
      children.filter(x => x.nodeType === HtmlNodeType.Element || (x.nodeType === HtmlNodeType.Text && x.textContent?.trim()))
      : []
    // console.log(":: activeChildNodes", hasElements, results, node.nodeName)
    return results

  }

  private parseHTML = (markup: string): Document | DocumentFragment => {
    if (markup.toLowerCase().trim().indexOf('<!doctype') === 0) {
      var doc = document.implementation.createHTMLDocument("");
      doc.documentElement.innerHTML = markup;
      // console.dir('A', doc)
      return doc;
    }

    if ('content' in document.createElement('template')) {
      // Template tag exists!
      var el = document.createElement('template');
      el.innerHTML = markup;
      // console.dir('B', el.content)
      return el.content;
    }

    // Template tag doesn't exist!
    var docfrag = document.createDocumentFragment();
    var el1 = document.createElement('body');
    el1.innerHTML = markup;
    for (let c of Array.from(el1.childNodes))
      docfrag.appendChild(c);

    // console.dir('C', docfrag)
    return docfrag;
  }

  private indent = (cnt: number) => this.tab.repeat(cnt)

  private isMultiLine = (value: string | null): boolean => (value?.split('\n') || []).length > 1;
}
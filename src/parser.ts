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
  commas: true,
  doubleQuotes: false,
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

  constructor(public options: IOptions) {
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

      for (var child of fragment.childNodes) {
        sb.push(this.createMarkup(child as HTMLElement));
      }

      return sb.join("\n")
    }

    return this.createMarkup(content)



  }


  private parseHTML = (markup: string): Document | DocumentFragment => {
    if (markup.toLowerCase().trim().indexOf('<!doctype') === 0) {
      var doc = document.implementation.createHTMLDocument("");
      doc.documentElement.innerHTML = markup;
      console.dir('A', doc)
      return doc;
    }

    if ('content' in document.createElement('template')) {
      // Template tag exists!
      var el = document.createElement('template');
      el.innerHTML = markup;
      console.dir('B', el.content)
      return el.content;
    }

    // Template tag doesn't exist!
    var docfrag = document.createDocumentFragment();
    var el1 = document.createElement('body');
    el1.innerHTML = markup;
    for (let c of el1.childNodes)
      docfrag.appendChild(c);

    console.dir('C', docfrag)
    return docfrag;
  }


  private createMarkup(el: HTMLElement, depth: number = 0) {
    console.group(">", el.tagName, el.nodeType)
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

    const children = this.activeChildNodes(el)

    if (children.length) {
      for (var child of children) {
        sb.push(this.createMarkup(child as HTMLElement, depth + 1));
      }
    }
    console.groupEnd();

    return sb.join("\n")

  }

  private createText(sb: StringArray, node: NodeLike, depth: number, indent: boolean = true, prefix: string = '|') {
    // console.log(":: createText", node.textContent)
    const text = node.textContent
    if (text === null) return
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

    if (classes)
      pugNode.push(`.${classes.join('.')}`)

    if (specialClasses.length > 0)
      attributeList.push(`class="${specialClasses.join(" ")}"`)

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


  private indent = (cnt: number) => this.tab.repeat(cnt)

  private isMultiLine = (value: string | null): boolean => (value?.split('\n') || []).length > 1;
}
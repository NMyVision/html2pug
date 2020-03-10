/**
 * Defines all the options for html2pug.
 */
interface IOptions {
  collapse: boolean;
  commas: boolean;
  doubleQuotes: boolean;
  tabs: boolean;
  preserveTags: String[]
  tabChar: string;
  whitespaceChar: string;
}

// Default options for html2pug.
export const defaultOptions = {
  collapse: true,
  commas: false,
  doubleQuotes: true,
  tabs: false,
  preserveTags: ['script', 'pre'],
  tabChar: '\t',
  whitespaceChar: '  '
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

  private tab: string;
  private quote: string;
  private space: string;
  private preserveTags: string[];

  constructor(public options: IOptions = defaultOptions) {
    this.tab = this.options.tabs ? options.tabChar : options.whitespaceChar
    this.quote = this.options.doubleQuotes ? `"` : `'`
    this.space = this.options.commas ? `, ` : ` `
    this.preserveTags = this.options.preserveTags.map(x => x.toUpperCase())
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
      for (const child of children) {

        text = this.createMarkup(child as HTMLElement, depth)
        if (text != null) { sb.push(text); }
      }
    }
  }

  private createMarkup(el: HTMLElement, depth: number = 0): string | null {
    // console.group(">", el.tagName || '#TEXT', el.nodeType, depth)
    const sb: StringArray = []

    if (el.nodeType === HtmlNodeType.Text) {
      const text = el.textContent
      if (text !== null && text.trim().length !== 0) {
        this.createText(sb, text, depth, '| ', true);
      }
    }
    else if (el.nodeType === HtmlNodeType.DocumentType) {
      sb.push('doctype html')
    }
    else {
      this.createElement(sb, el, depth);
    }

    const cs = this.canShorten(el) && this.options.collapse

    if (el.nodeType !== HtmlNodeType.Text) {
      const children = this.activeChildNodes(el)
      this.parseNodes(children, sb, cs ? depth : depth + 1);
    }
    // console.groupEnd();
    if (sb.length === 0) { return null; }
    return (cs) ? sb.join(": ") : sb.join("\n");

  }

  private createText(sb: StringArray, text: String, depth: number, prefix: string = '| ', preserve: boolean = false) {
    const segments = text.split('\n')
    const lines: string[] = []
    segments.forEach((segment, index) => {
      const a: string[] = []
      const trimmed_segment = segment.trim()
      if (trimmed_segment.length === 0 && (index === 0 || index == segments.length - 1)) { return }
      a.push(this.indent(depth))
      if (prefix) {
        a.push(prefix)
      }
      if (segment.startsWith(' ') && !segment.startsWith('  ') && preserve) {
        a.push(' ')
      }
      if (trimmed_segment.length > 0) {
        a.push(trimmed_segment)
      }
      if (segment.endsWith(' ') && preserve) {
        a.push(' ')
      }

      lines.push(a.join(''))

    })
    sb.push(lines.join('\n'))
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
        const c = value.split(" ")
        specialClasses = c.filter(x => /[:.\/]/.test(x))
        classes = c.filter(x => !(/[:.\/]/.test(x)))
        shorten = shorten || classes.length > 0
      }
      else {
        attributeList.push(`${name}=${this.quote}${value}${this.quote}`)
      }
    }


    // Remove div tagName
    if (tagName === "div" && shorten) {
      pugNode.splice(0, 1)
    }

    if (node.id) {
      pugNode.push(`#${node.id}`)
    }

    if (classes.length) {
      pugNode.push(`.${classes.join('.')}`)
    }

    if (specialClasses.length > 0) {
      attributeList.push(`class=${this.quote}${specialClasses.join(" ")}${this.quote}`)
    }

    if (attributeList.length > 0) {
      pugNode.push(`(${attributeList.join(this.space)})`)
    }



    if (node.hasChildNodes && node.childNodes.length === 1 && node.childNodes[0].nodeType === HtmlNodeType.Text) {
      const text = node.childNodes[0].textContent
      if (text !== null && text.trim().length !== 0) {
        if ((text.split('\n') || []).length > 1) {
          if (this.preserveTags.includes(node.nodeName)) {
            pugNode.push('.\n')
            this.createText(pugNode, text, depth + 1, "")
          } else {
            pugNode.push('\n')
            this.createText(pugNode, text, depth + 1)
          }
        }
        else {
          pugNode.push(` ${text}`)
        }
      }
    }

    // console.log("pugNode:", pugNode)
    sb.push(`${this.indent(depth)}${pugNode.join("")}`)
  }

  private canShorten(node: NodeLike): boolean {
    if (node.hasChildNodes && node.childNodes.length === 1) {
      if (node.childNodes[0].nodeType === HtmlNodeType.Text) {
        return ((node.childNodes[0].textContent?.split('\n') || []).length > 1) ? false : true
      }

      return this.canShorten(node.childNodes[0])
    }
    return false
  }


  private activeChildNodes(node: NodeLike): NodeLike[] {
    let children = Array.from(node.childNodes)

    if (node.nodeName === "TEMPLATE") {
      children = Array.from((node as HTMLTemplateElement).content.childNodes)
    }

    const hasElements = (node.nodeType === HtmlNodeType.Element && children.filter(x => x.nodeType === HtmlNodeType.Element).length)

    const results = hasElements ?
      children.filter(x => x.nodeType === HtmlNodeType.Element || (x.nodeType === HtmlNodeType.Text && x.textContent?.trim()))
      : []
    // console.log(":: activeChildNodes", hasElements, results, node.nodeName)
    return results

  }

  private parseHTML = (markup: string): Document | DocumentFragment => {
    if (markup.toLowerCase().trim().indexOf('<!doctype') === 0) {
      const doc = document.implementation.createHTMLDocument("");
      doc.documentElement.innerHTML = markup;
      // console.dir('A', doc)
      return doc;
    }

    if ('content' in document.createElement('template')) {
      // Template tag exists!
      const el = document.createElement('template');
      el.innerHTML = markup;
      // console.dir('B', el.content)
      return el.content;
    }

    // Template tag doesn't exist!
    const docfrag = document.createDocumentFragment();
    const el1 = document.createElement('body');
    el1.innerHTML = markup;
    for (const c of Array.from(el1.childNodes)) {
      docfrag.appendChild(c);
    }

    // console.dir('C', docfrag)
    return docfrag;
  }

  private indent = (cnt: number) => this.tab.repeat(cnt)
}
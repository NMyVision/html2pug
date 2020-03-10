import { defaultOptions, Parser } from "../src/parser"

test('Should be in an instance of Parser', () => {
  expect(new Parser(defaultOptions)).toBeInstanceOf(Parser)
})

describe("Handle attributes", () => {
  const p = new Parser(defaultOptions);
  test('check class', () => {
    const html = `<div class="foo"/>`
    const output = p.parse(html)
    expect(output).toBe(`.foo`)
  })
  test('check special class names (:)', () => {

    const html = `<div class="foo:hover"/>`
    const output = p.parse(html)
    expect(output).toBe(`div(class="foo:hover")`)
  })
  test('check special class names (/)', () => {

    const html = `<div class="x-translate-1/2"/>`
    const output = p.parse(html)
    expect(output).toBe(`div(class="x-translate-1/2")`)
  })
  test('check special class names (.)', () => {

    const html = `<div class="p-1.5"/>`
    const output = p.parse(html)
    expect(output).toBe(`div(class="p-1.5")`)
  })
  test('check special class names and regular class names', () => {

    const html = `<div class="p-a foo:hover"/>`
    const output = p.parse(html)
    expect(output).toBe(`.p-a(class="foo:hover")`)
  })
  test('with id attribute', () => {
    const html = `<div id="app" class="p-a foo:hover"/>`
    const output = p.parse(html)
    expect(output).toBe(`#app.p-a(class="foo:hover")`)
  })
  test('without id attribute', () => {
    const html = `<div class="foo:hover"/>`
    const output = p.parse(html)
    expect(output).toBe(`div(class="foo:hover")`)
  })
  test('attributes', () => {
    const html = `<div data-position="0" class="foo:hover"/>`
    const output = p.parse(html)
    expect(output).toBe(`div(data-position="0" class="foo:hover")`)
  })
})

describe("Handle text", () => {
  const options = Object.assign({}, defaultOptions, { whitespaceChar: '..' })
  test('simple text', () => {
    const p = new Parser();
    const html = `<div class="foo:hover">Hello World</div>`
    const output = p.parse(html)
    expect(output).toBe(`div(class="foo:hover") Hello World`)
  })
  test('trailing space', () => {
    const p = new Parser(defaultOptions);
    const html = `<div>Hello World </div>`
    const output = p.parse(html)
    expect(output).toBe(`div Hello World `)
  })
  test('text wrapped with spaces', () => {
    const p = new Parser(options);
    const html = `<div><a>Hello World</a> | <a>Hello Universe</a></div>`
    const output = p.parse(html)
    let exp = [
      'div',
      '..a Hello World',
      '..|  | ',
      '..a Hello Universe'
    ].join('\n')
    expect(output).toBe(exp)
  })

  test('pre single line', () => {
    const p = new Parser(defaultOptions);
    const html = `<pre>Hello World</pre>`
    const output = p.parse(html)
    expect(output).toBe('pre Hello World')
  })
  test('pre multiline', () => {
    const p = new Parser(options);

    console.log(p.tab)
    let html = `
<pre>
  Hello World
  Hello Universe
</pre>`
    let output = p.parse(html)
    let exp = [
      'pre.',
      '..Hello World',
      '..Hello Universe'
    ].join('\n')
    expect(output).toBe(exp)
  })
  test('pre multiline empty line', () => {
    const p = new Parser(options);

    let html = `
<pre>
  Hello World

  Hello Universe
</pre>`
    let output = p.parse(html)

    let exp = [
      'pre.',
      '..Hello World',
      '..',
      '..Hello Universe'
    ].join('\n')
    expect(output).toBe(exp)
  })
  test('complex structure', () => {
    const p = new Parser(options);
    let html = `
  <div class="sm:mr-6">
    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="..." clip-rule="evenodd" />
      <path d="..." />
    </svg>
    Full-time
  </div>`

    let output = p.parse(html)
    let exp = [
      `div(class="sm:mr-6")`,
      `..svg.w-6.h-6(fill="currentColor" viewBox="0 0 20 20")`,
      `....path(fill-rule="evenodd" d="..." clip-rule="evenodd")`,
      `....path(d="...")`,
      `..| Full-time`
    ].join('\n')
    expect(output).toBe(exp)
  })
  test('complex structure with tabs', () => {
    const p = new Parser(options);
    let html = `
  <div class="sm:mr-6">
  \t<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
  \t\t<path fill-rule="evenodd" d="..." clip-rule="evenodd" />
  \t\t<path d="..." />
  \t</svg>
  \tFull-time
  </div>`

    let output = p.parse(html)
    let exp = [
      `div(class="sm:mr-6")`,
      `..svg.w-6.h-6(fill="currentColor" viewBox="0 0 20 20")`,
      `....path(fill-rule="evenodd" d="..." clip-rule="evenodd")`,
      `....path(d="...")`,
      `..| Full-time`
    ].join('\n')
    expect(output).toBe(exp)
  })
})

describe("Handle shortcut", () => {

  test('shorthand not allowed', () => {
    const options = Object.assign({}, defaultOptions, { whitespaceChar: '..', collapse: false })
    const p = new Parser(options);
    const html = `<div id="app"><span>Hello World</span></div>`
    const output = p.parse(html)
    let exp = [
      `#app`,
      `..span Hello World`
    ].join('\n')
    expect(output).toBe(exp)
  })
  test('simple shorthand', () => {
    const p = new Parser();
    const html = `<div id="app"><span>Hello World</span></div>`
    const output = p.parse(html)
    const exp = `#app: span Hello World`
    expect(output).toBe(exp)
  })
})
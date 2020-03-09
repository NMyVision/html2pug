import { defaultOptions, Parser } from "./parser"

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
  test('without id attribute', () => {
    const p = new Parser(defaultOptions);
    const html = `<div class="foo:hover">Hello World</div>`
    const output = p.parse(html)
    expect(output).toBe(`div(class="foo:hover") Hello World`)
  })

  test('pre single line', () => {
    const p = new Parser(defaultOptions);
    const html = `<pre>Hello World</pre>`
    const output = p.parse(html)
    expect(output).toBe('pre Hello World')
  })
  test('pre multiline', () => {
    const p = new Parser(defaultOptions);
    let html = `
<pre>
  Hello World
  Hello Universe
</pre>`
    let output = p.parse(html)
    console.log(output)
    let exp = ['pre.', '   Hello World', '   Hello Universe'].join('\n')
    expect(output).toBe(exp)
  })
})
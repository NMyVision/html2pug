# html2pug


#### ✔ Documentation is for v2 which is a complete rewrite 

Converts **HTML** to **Pug** templating language (_formerly Jade_).  
Requires Node.js version `7.6` or higher. Library written in typescript.

Turns this :unamused:
```html
<!DOCTYPE html>
<html lang="en">

  <head>
    <title>Jade</title>
    <script type="text/javascript">
      const foo = true;
      let bar = function() {};
      if (foo) {
        bar(1 + 5)
      }
    </script>
  </head>

  <body>
    <h1>Pug - node template engine</h1>
    <nav aria-label="breadcrumb">
      <ol class="breadcrumb">
        <li class="breadcrumb-item active" aria-current="page">Home</li>
      </ol>
    </nav>
    <div class="col" id="container">
      <p>You are amazing</p>
      <p>
        Jade is a terse and simple
        templating language with a
        strong focus on performance
        and powerful features.
      </p>
    </div>
  </body>

</html>
```

Into this :tada:
```pug
doctype html
html
  head
    title Jade
    script(type="text/javascript").
      const foo = true;
      let bar = function() {};
      if (foo) {
      bar(1 + 5)
      }
  body
    h1 Pug - node template engine
    nav(aria-label="breadcrumb"): ol.breadcrumb: li.breadcrumb-item.active(aria-current="page") Home
    #container.col
      p You are amazing
      p
        | Jade is a terse and simple
        | templating language with a
        | strong focus on performance
        | and powerful features.
```


## Programmatically

```js
import Parser from "@nmyvision/html2pug"

const parser = new Parser({ tabs: true, collapse: true }) 
/* new Parser(undefined) ... for defaults */
const html = '<header><h1 class="title">Hello World!</h1></header>'
const pug = parser.parse(html)
```

## Options

Name | Version | Type | Default | Description
--- | --- | --- | --- | ---
tabs | all | Boolean | `false` | Use tabs instead of spaces
collapse | all | Boolean | `true` | Combine when possible using : notation
commas | v2 | Boolean | `false` | Add commas between attributes
doubleQuotes | v2 | Boolean | `true` | Use double quotes 
tabs | v2 | Boolean | `false` | Use tabs (`tabChar`) otherwise use (`whitespaceChar`)
preserveTags | v2 | Boolean | `['script', 'pre']` | element renders with . ending
tabChar | v2 | Boolean | `'\t'` | system tab character
whitespaceChar | v2 | Boolean | `'  '` | two spaces

# Why 

*Why even create another HTML 2 Pug/Jade library?*

There were a few scenerios that most libraries didn't address. 

## Shorthand 

***source***
```html
<nav aria-label="breadcrumb">
  <ol class="breadcrumb">
    <li>Sample</li>
  </ol>
</nav>
```
**before**

```pug
nav(aria-label="breadcrumb")
  ol.breadcrumb
    li Sample
```

**after** (with collapse flag)
```pug
nav(aria-label="breadcrumb"): ol.breadcrumb: li Sample
```
## Proper handle of non typical class names 

**source**
```html
<ol class="sm:hover x-translate-1/2">
  Stuff  
</ol>

<div class="sm:hover x-translate-1/2">
  Stuff  
</div>
```
**before** note period "ol."
```pug
ol.(class='sm:hover x-translate-1/2')
  | Stuff

.(class='sm:hover x-translate-1/2')
  | Stuff
```

**after**
```pug
ol(class="sm:hover x-translate-1/2") Stuff

div(class="sm:hover x-translate-1/2") Stuff
```
---

## Some invalid results 

**source**
```html
<a>Link A</a> | <a>Link</a>
```
**before**
```pug
a Link A
|  
a Link B
```

**after** spaces shown with '.'
```pug
a Link A
| .|.
a Link B
```
<!--
textElements | String[] | `['pre','script']`| element renders with . ending
recommended | Boolean | `false` | wrap extra \| around elements surrounded by text
omitPre | Boolean | `true` | Do not render the contents of the pre text -->

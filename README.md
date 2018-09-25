# html2pug

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
html(lang='en')
  head
    title Hello World!
   body
    nav(aria-label="breadcrumb"): ol.breadcrumb: li.breadcrumb-item.active(aria-current="page") Home
    #content
      h1.title Hello World!
```


### Programmatically

```js
import Parser from "@nmyvision/html2pug"

const parser = new Parser({ tabs: true, collapse: true }) 
/* new Parser(undefined) ... for defaults */
const html = '<header><h1 class="title">Hello World!</h1></header>'
const pug = parser.parse(html)
```

### Options

Name | Type | Default | Description
--- | --- | --- | ---
tabs | Boolean | `false` | Use tabs instead of spaces
collapse | Boolean | `true` | Combine when possible using : notation

<!--
textElements | String[] | `['pre','script']`| element renders with . ending
recommended | Boolean | `false` | wrap extra \| around elements surrounded by text
omitPre | Boolean | `true` | Do not render the contents of the pre text -->

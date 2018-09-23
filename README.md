# html2pug

Converts **HTML** to **Pug** templating language (_formerly Jade_).  
Requires Node.js version `7.6` or higher. Library written in typescript.

Turns this :unamused:
```html
<!doctype html>
<html lang="en">
  <head>
    <title>Hello World!</title>
  </head>
  <body>
    <div id="content">
      <h1 class="title">Hello World!</h1>
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
    #content
      h1.title Hello World!
```


### Programmatically

```js
import Parser from "@nmyvision/html2pug"

const parser = new Parser({ tabs: true, collapse: true }) 
/* new Parser(undefined) ... for defaults */
const html = '<header><h1 class="title">Hello World!</h1></header>'
const pug = html2pug(html)
```

### Options

Name | Type | Default | Description
--- | --- | --- | ---
tabs | Boolean | `false` | Use tabs instead of spaces
collapse | Boolean | `true` | Combine when possible using : notation
textElements | String[] | `['pre','script']`| element renders with . ending
recommended | Boolean | `false` | wrap extra \| around elements surrounded by text
omitPre | Boolean | `true` | Do not render the contents of the pre text

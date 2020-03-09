import { Parser, defaultOptions } from "./parser"

test('', () => {

  console.clear()

  let html = `<!DOCTYPE html>
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
  <h1>Jade - node template engine</h1>
  <div class="col -translate-y-1/2 sm:p-1.5" id="container">
    <p>You are amazing</p>
    <p>
      Jade is a terse and simple
      templating language with a
      strong focus on performance
      and powerful features.
    </p>
    <b>Hello <span>World</span></b>
  </div>

  <template><child /></template>


  <CustomModal></CustomModal>
</body>

</html>`;

  var p = new Parser(defaultOptions);

  var output = p.parse(html)

  console.log(output)

  expect(p).toBeInstanceOf(Parser)
})

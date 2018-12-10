# ts2tf
A tool that (hopefully) automates the mapping of typescript type syntax (`interface`, `type` etc) to typeforce types.

Like Javascript, it does **not** support circular references.

Requires typescript types to be defined before usage (aka, in order).

**WARNING**: This is a **WORK IN PROGRESS**.
The output typeforce types may be undefined, out of order, produce unexpected behaviour or who knows what... do **NOT** expect the output to work at all.
You need to review and fix.


### Example
``` bash
node index.js test.d.ts
```

## LICENSE [MIT](LICENSE)

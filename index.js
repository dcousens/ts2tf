const fs = require('fs')
const ts = require('typescript')
const TOKEN = ts.SyntaxKind

const code = fs.readFileSync(process.argv[2]).toString('utf8')
const root = ts.createSourceFile('tmp.ts', code, ts.ScriptTarget.Latest, true)

function getTfType (node) {
  switch (node.kind) {
    case TOKEN.EndOfFileToken: return

    case TOKEN.BooleanKeyword: return 'boolean'
    case TOKEN.NumberKeyword: return 'number'
    case TOKEN.StringKeyword: return 'string'
    case TOKEN.LiteralType: {
      const text = node.getText()
      return {
        literal: eval(text) // oh no
      }
    }
    case TOKEN.TypeLiteral: return node.members.map(getTfType)
    case TOKEN.ArrayType: {
      return { array: getTfType(node.elementType) }
    }
    case TOKEN.TypeReference: {
      return { ref: node.getText() }
    }
    case TOKEN.IntersectionType: {
      return { and: node.types.map(getTfType) }
    }
    case TOKEN.UnionType: {
      return { or: node.types.map(getTfType) }
    }
    case TOKEN.IndexedAccessType: {
      return {
        iref: getTfType(node.objectType).ref,
        ikey: getTfType(node.indexType).literal
      }
    }
    case TOKEN.ParenthesizedType: {
      return getTfType(node.type)
    }

    case TOKEN.InterfaceDeclaration: {
      const name = node.name.getText()
      return {
        name,
        type: node.members.map(m => getTfType(m))
      }
    }

    case TOKEN.TypeAliasDeclaration:
    case TOKEN.PropertySignature: {
      const name = node.name.getText()
      const type = getTfType(node.type)
      if (!node.questionToken) return { name, type }
      return {
        name,
        type,
        maybe: true
      }
    }
  }

  throw new TypeError(`Unsupported TOKEN ${node.kind}`)
}

const results = []
ts.forEachChild(root, (node) => {
  const result = getTfType(node)
  if (!result) return
  results.push(result)
})

console.log(results)

const fs = require('fs')
const ts = require('typescript')
const TOKEN = ts.SyntaxKind

const code = fs.readFileSync(process.argv[2]).toString('utf8')
const root = ts.createSourceFile('tmp.ts', code, ts.ScriptTarget.Latest, true)

function getType (type) {
  switch (type.kind) {
    case TOKEN.BooleanKeyword: return 'boolean'
    case TOKEN.NumberKeyword: return 'number'
    case TOKEN.StringKeyword: return 'string'
    case TOKEN.LiteralType: {
      const text = type.getText()
      return {
        literal: eval(text) // oh no
      }
    }
    case TOKEN.TypeLiteral: return type.members.map(getNode)
    case TOKEN.ArrayType: {
      return { array: getType(type.elementType) }
    }
    case TOKEN.TypeReference: {
      return { ref: type.getText() }
    }
    case TOKEN.IntersectionType: {
      return { and: type.types.map(getType) }
    }
    case TOKEN.UnionType: {
      return { or: type.types.map(getType) }
    }
    case TOKEN.IndexedAccessType: {
      return {
        iref: getType(type.objectType).ref,
        ikey: getType(type.indexType).literal
      }
    }
    case TOKEN.ParenthesizedType: {
      return getType(type.type)
    }
  }

  throw new TypeError(`Unsupported TOKEN ${type.kind}`)
}

function getNode (node) {
  switch (node.kind) {
    case TOKEN.EndOfFileToken: return

    case TOKEN.InterfaceDeclaration: {
      const name = node.name.getText()
      return {
        name,
        type: node.members.map(m => getNode(m))
      }
    }

    case TOKEN.TypeAliasDeclaration:
    case TOKEN.PropertySignature: {
      const name = node.name.getText()
      const type = getType(node.type)
      if (!node.questionToken) return { name, type }
      return {
        name,
        type,
        maybe: true
      }
    }
  }
}

const results = []
ts.forEachChild(root, (node) => {
  const result = getNode(node)
  if (!result) return
  results.push(result)
})

console.log(results)

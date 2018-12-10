const fs = require('fs')
const ts = require('typescript')
const TOKEN = ts.SyntaxKind

const code = fs.readFileSync(process.argv[2]).toString('utf8')
const root = ts.createSourceFile('tmp.ts', code, ts.ScriptTarget.Latest, true)

function getType (node) {
  switch (node.kind) {
    case TOKEN.EndOfFileToken: return

    case TOKEN.BooleanKeyword: return 'boolean'
    case TOKEN.NumberKeyword: return 'number'
    case TOKEN.StringKeyword: return 'string'
    case TOKEN.LiteralType: {
      const text = node.getText()
      return { literal: eval(text) } // oh no
    }
    case TOKEN.TypeLiteral: {
      return {
        object: node.members.map(getType)
      }
    }
    case TOKEN.ArrayType: {
      return { array: getType(node.elementType) }
    }
    case TOKEN.TypeReference: {
      return { ref: node.getText() }
    }
    case TOKEN.IntersectionType: {
      return { and: node.types.map(getType) }
    }
    case TOKEN.UnionType: {
      return { or: node.types.map(getType) }
    }
    case TOKEN.IndexedAccessType: {
      return {
        iref: getType(node.objectType).ref,
        ikey: getType(node.indexType).literal
      }
    }
    case TOKEN.ParenthesizedType: {
      return getType(node.type)
    }

    case TOKEN.InterfaceDeclaration: {
      return {
        name: node.name.getText(),
        object: node.members.map(m => getType(m))
      }
    }

    case TOKEN.TypeAliasDeclaration: {
      return {
        name: node.name.getText(),
        alias: getType(node.type)
      }
    }

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

  throw new TypeError(`Unsupported TOKEN ${node.kind}`)
}

function toDecl (name, type, isProperty) {
  if (isProperty === null) return `${type}`
  if (isProperty) return `${name}: ${type}`
  return `const ${name} = ${type}`
}

function typeToTfString (t, isProperty) {
  const { name, type } = t
  if (type === 'boolean') return toDecl(name, 'tf.Boolean', isProperty)
  if (type === 'number') return toDecl(name, 'tf.Number', isProperty)
  if (type === 'string') return toDecl(name, 'tf.String', isProperty)
  if ('alias' in t) return toDecl(name, typeToTfString(t.alias, null), isProperty)
  if ('array' in t) return toDecl(name, `tf.arrayOf(` + typeToTfString(t.array, null) + `)`, isProperty)
  if ('object' in t) {
    return toDecl(name, [
      'tf.compile({',
      t.object.map(x => typeToTfString(x, true)).join(', '),
      '})'
    ].join(' '), isProperty)
  }
  if ('literal' in t) return toDecl(name, `tf.value(${t.literal})`, isProperty)
  if ('ref' in t) return toDecl(name, `${t.ref}`, isProperty)
  if ('and' in t) {
    return toDecl(name, [
      'tf.allOf(',
      t.and.map(x => typeToTfString(x, null)).join(', '),
      ')'
    ].join(''), isProperty)
  }
  if ('or' in t) {
    return toDecl(name, [
      'tf.anyOf(',
      t.or.map(x => typeToTfString(x, null)).join(', '),
      ')'
    ].join(''), isProperty)
  }

  throw new Error('Unknown')
}

const results = []
ts.forEachChild(root, (node) => {
  const result = getType(node)
  if (!result) return
  results.push(result)
})

//  console.log(results)
console.log(results.map(x => typeToTfString(x, false)))

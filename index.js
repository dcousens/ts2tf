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
    case TOKEN.ParenthesizedType: return getType(node.type)
    case TOKEN.LiteralType: return { literal: node.getText() }
    case TOKEN.TypeLiteral: {
      return {
        object: node.members.map(getType)
      }
    }

    case TOKEN.ArrayType: {
      return { array: getType(node.elementType) }
    }

    case TOKEN.InterfaceDeclaration: {
      return {
        name: node.name.getText(),
        interface: {
          object: node.members.map(m => getType(m))
        }
      }
    }

    case TOKEN.TypeAliasDeclaration: {
      return {
        name: node.name.getText(),
        alias: getType(node.type)
      }
    }

    case TOKEN.PropertySignature: {
      if (node.questionToken) {
        return {
          name: node.name.getText(),
          property: {
            maybe: getType(node.type)
          }
        }
      }

      return {
        name: node.name.getText(),
        property: getType(node.type)
      }
    }

    case TOKEN.IntersectionType: {
      return { and: node.types.map(getType) }
    }

    case TOKEN.UnionType: {
      return { or: node.types.map(getType) }
    }

    case TOKEN.TypeReference: {
      return { ref: node.getText() }
    }

    case TOKEN.IndexedAccessType: {
      console.warn('Indexed types may map properly')
      return {
        iref: getType(node.objectType).ref,
        ikey: getType(node.indexType).literal
      }
    }
  }

  throw new TypeError(`Unsupported ${TOKEN[node.kind]} token`)
}

function toDecl (name, type, isProperty) {
  if (isProperty) return `${name}: ${type}`
  return `const ${name} = ${type}`
}

function typeToTfString (t) {
  if (t === 'boolean') return 'tf.Boolean'
  if (t === 'number') return 'tf.Number'
  if (t === 'string') return 'tf.String'

  if ('alias' in t) return toDecl(t.name, typeToTfString(t.alias), false)
  if ('property' in t) return toDecl(t.name, typeToTfString(t.property), true)
  if ('interface' in t) return toDecl(t.name, typeToTfString(t.interface), false)

  if ('array' in t) return `tf.arrayOf(` + typeToTfString(t.array, null) + `)`
  if ('and' in t) return 'tf.allOf(' + t.and.map(typeToTfString).join(', ') + ')'
  if ('maybe' in t) return 'tf.maybe(' + typeToTfString(t.maybe) + ')'
  if ('object' in t) return '{ ' + t.object.map(typeToTfString).join(', ') + ' }'
  if ('or' in t) return 'tf.anyOf(' + t.or.map(typeToTfString).join(', ') + ')'

  if ('literal' in t) return `tf.value(${t.literal})`
  if ('ref' in t) return `${t.ref}`
  if ('iref' in t) return `${t.iref}[${t.ikey}]`
}

ts.forEachChild(root, (node) => {
  const result = getType(node)
  if (!result) return

  console.log(typeToTfString(result))
})

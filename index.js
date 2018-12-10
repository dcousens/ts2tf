const fs = require('fs')
const ts = require('typescript')
const TOKEN = ts.SyntaxKind

const code = fs.readFileSync(process.argv[2]).toString('utf8')
const es6 = process.argv[3] === '-es6'
const root = ts.createSourceFile('tmp.ts', code, ts.ScriptTarget.Latest, true)

function hasExport (modifiers) {
  if (!modifiers) return false
  return modifiers.some(x => x.kind === TOKEN.ExportKeyword)
}

function getType (node) {
  switch (node.kind) {
    case TOKEN.EndOfFileToken: return

    case TOKEN.BooleanKeyword: return 'boolean'
    case TOKEN.NumberKeyword: return 'number'
    case TOKEN.StringKeyword: return 'string'
    case TOKEN.ParenthesizedType: return getType(node.type)
    case TOKEN.NullKeyword: return { literal: 'null' }
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
        export: hasExport(node.modifiers),
        interface: {
          object: node.members.map(m => getType(m))
        }
      }
    }

    case TOKEN.TypeAliasDeclaration: {
      return {
        name: node.name.getText(),
        export: hasExport(node.modifiers),
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
      console.warn('WARN: indexed type mappings are dangerous, and typically return undefined for non-trivial types')
      return {
        iref: getType(node.objectType).ref,
        ikey: getType(node.indexType).literal
      }
    }
  }

  throw new TypeError(`Unsupported ${TOKEN[node.kind]} token`)
}

const tfExports = []

function toDecl (name, type, isProperty, isExport) {
  if (isProperty) return `${name}: ${type}`
  if (isExport) {
    if (es6) return `export const ${name} = ${type}`
    tfExports.push(name)
  }
  return `const ${name} = ${type}`
}

function typeToTfString (t) {
  if (t === 'boolean') return 'tf.Boolean'
  if (t === 'number') return 'tf.Number'
  if (t === 'string') return 'tf.String'

  if ('alias' in t) return toDecl(t.name, typeToTfString(t.alias), false, t.export)
  if ('property' in t) return toDecl(t.name, typeToTfString(t.property), true)
  if ('interface' in t) return toDecl(t.name, typeToTfString(t.interface), false, t.export)

  if ('array' in t) return `tf.arrayOf(` + typeToTfString(t.array, null) + `)`
  if ('and' in t) return 'tf.allOf(' + t.and.map(typeToTfString).join(', ') + ')'
  if ('maybe' in t) return 'tf.maybe(' + typeToTfString(t.maybe) + ')'
  if ('object' in t) return '{ ' + t.object.map(typeToTfString).join(', ') + ' }'
  if ('or' in t) return 'tf.anyOf(' + t.or.map(typeToTfString).join(', ') + ')'

  if ('literal' in t) return `tf.value(${t.literal})`
  if ('ref' in t) return `${t.ref}`
  if ('iref' in t) return `${t.iref}[${t.ikey}]`
}

if (es6) {
  console.log('import * as tf from \'typeforce\'')
} else {
  console.log('const tf = require(\'typeforce\')')
}

ts.forEachChild(root, (node) => {
  const result = getType(node)
  if (!result) return

  console.log(typeToTfString(result))
})

if (!es6) {
  console.log(`module.exports = {`)
  console.log(tfExports.map(name => `  ${name}`).join(',\n'))
  console.log(`}`)
}

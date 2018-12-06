#!/bin/node

const fs = require('fs')
const ts = require('typescript')
const TOKEN = ts.SyntaxKind

const code = fs.readFileSync(process.argv[2]).toString('utf8')
const root = ts.createSourceFile('tmp.ts', code, ts.ScriptTarget.Latest, true)

function getNode (node) {
  switch (node.kind) {
    case TOKEN.EndOfFileToken: return

    case TOKEN.InterfaceDeclaration: {
      return {}
    }

    case TOKEN.TypeAliasDeclaration:
    case TOKEN.PropertySignature: {
      return {}
    }
  }
}

const results = []
ts.forEachChild(root, (node) => {
  results.push(getNode(node))
})

console.log(results)

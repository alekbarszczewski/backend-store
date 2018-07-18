const ow = require('ow')
const readdir = require('fs-readdir-recursive')
const path = require('path')
const fs = require('fs')

function loadMethods (store, options = {}) {
  ow(options.path, ow.string.label('options.path'))

  const fileFilter = options.filter || defaultFilter

  ow(fileFilter, ow.function.label('options.filter'))

  const stat = fs.statSync(options.path)
  if (!stat.isDirectory()) {
    throw new Error(`Directory ${options.path} does not exist`)
  }

  const modules = readdir(options.path)
    .map(filePath => {
      filePath = path.join(options.path, filePath)
      const relativePath = path.relative(options.path, filePath)
      const moduleName = path.basename(relativePath, path.extname(relativePath))
      const fileName = path.basename(relativePath)
      let namespace = path.dirname(relativePath)
      namespace = namespace === '.' ? '' : namespace
      return { filePath, fileName, relativePath, moduleName, namespace }
    })
    .filter(fileFilter)

  modules.forEach(({ filePath, relativePath, moduleName, namespace }) => {
    const prefix = namespace === '' ? '' : `${namespace}/`

    const define = (name, fn, meta) => {
      if (typeof name === 'function') {
        meta = fn
        fn = name
        name = moduleName
      }
      const fnName = `${prefix}${name}`
      store.define(fnName, fn, meta)
    }

    const moduleFile = require(filePath)
    const moduleFn = moduleFile.default || moduleFile

    if (moduleFn && typeof moduleFn === 'function') {
      moduleFn({ define })
    }
  })
}

function defaultFilter ({ filePath }) {
  return filePath.match(/\.js$/)
}

module.exports = loadMethods

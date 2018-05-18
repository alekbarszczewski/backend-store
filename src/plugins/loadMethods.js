const ow = require('ow')
const dir = require('node-dir')
const path = require('path')

function loadMethods (store, options = {}) {
  ow(options.path, ow.string)

  const fileFilter = options.filter || defaultFilter

  const modules = (dir.files(options.path, { sync: true }) || [])
    .map(filePath => {
      const relativePath = path.relative(options.path, filePath)
      const moduleName = path.basename(relativePath, path.extname(relativePath))
      let namespace = path.dirname(relativePath)
      namespace = namespace === '.' ? '' : namespace
      return { filePath, relativePath, moduleName, namespace }
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

    moduleFn({ define })
  })
}

function defaultFilter ({ filePath }) {
  return filePath.match(/\.js$/)
}

module.exports = loadMethods

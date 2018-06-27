async function fn1 (data) {
  return fn2(data)
}

async function fn2 (data) {
  return Promise.all([
    fn3(data),
    fn4(data)
  ])
}

async function fn3 (data) {
  return fn5(data)
}

async function fn4 (data) {
  return fn5(data)
}

async function fn5 (data) {
  return true
}

module.exports.test = () => {
  return fn1({})
}

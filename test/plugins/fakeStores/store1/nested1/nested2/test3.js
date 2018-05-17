module.exports = ({ define }) => {
  define('test1', () => ['nested1/nested2/test1'])
  define(() => ['nested1/nested2/test3'])
}

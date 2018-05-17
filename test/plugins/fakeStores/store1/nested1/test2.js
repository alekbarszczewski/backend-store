module.exports = ({ define }) => {
  define('test1', () => ['nested1/test1'])
  define(() => ['nested1/test2'])
}

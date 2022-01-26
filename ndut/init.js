module.exports = async function (options) {
  const { _ } = this.ndut.helper
  if (!options.connections) return
  if (!_.isArray(options.connections)) options.connections = [options.connections]
  for (let c of options.connections) {
    if (_.isString(c)) c = { url: c }
    if (!_.has(c, 'name')) {
      if (_.find(options.connections, { name: 'default' })) throw new Error('Connection \'default\' already exists')
      else c.name = 'default'
    }
    c.options = c.options || {}
    if (c.subscribe) {
      if (_.isString(c.subscribe)) c.subscribe = { topic: c.subscribe }
      c.subscribe.options = c.subscribe.options || {}
    }
  }
  const names = _.map(options.connections, 'name')
  const uniqNames = _.uniq(names)
  if (names.length !== uniqNames.length) throw new Error(`One or more connections shared the same names`)
}

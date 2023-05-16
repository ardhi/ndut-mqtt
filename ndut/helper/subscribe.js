module.exports = function (topic, handler, conn = 'default', now, publish) {
  const { _, getNdutConfig } = this.ndut.helper
  let opts = _.cloneDeep(topic)
  if (_.isString(topic)) opts = { topic, handler, connection: conn, bindNow: now, publish }
  const config = getNdutConfig('ndutMqtt')
  this.ndutMqtt.subscribe = this.ndutMqtt.subscribe || {}
  if (opts.connection === 'all') opts.connection = _.map(config.connections, 'name')
  else if (_.isString(opts.connection)) opts.connection = opts.connection.split(',')
  if (!this.ndutMqtt.subscribe[opts.topic]) this.ndutMqtt.subscribe[opts.topic] = []
  for (const c of opts.connection) {
    const o = _.pick(opts, ['topic', 'handler', 'publish', 'relay'])
    o.connection = c
    this.ndutMqtt.subscribe[o.topic].push(o)
    if (now) {
      this.ndutMqtt.instance[c].subscribe(o)
      this.log.debug(`[MQTT][${conn.name}] subscribed to ${o.topic}`)
    }
  }
}

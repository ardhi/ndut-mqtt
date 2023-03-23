module.exports = async function (topic, handler, conn = 'default', now) {
  const { _, getNdutConfig } = this.ndut.helper
  const options = getNdutConfig('ndutMqtt')
  this.ndutMqtt.subscribe = this.ndutMqtt.subscribe || {}
  if (!this.ndutMqtt.subscribe[topic]) this.ndutMqtt.subscribe[topic] = []
  if (conn === 'all') conn = _.map(options.connections, 'name')
  else conn = conn.split(',')
  for (const c of conn) {
    this.ndutMqtt.subscribe[topic].push(_.merge({}, { topic, handler }, { connection: c }))
    if (now) {
      this.ndutMqtt.instance[c].subscribe(topic)
      this.log.debug(`[MQTT][${conn.name}] subscribed to ${t}`)
    }
  }
}

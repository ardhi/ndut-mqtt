module.exports = async function (conn) {
  const { _, getNdutConfig } = this.ndut.helper
  const config = getNdutConfig('ndutMqtt')
  this.log.debug(`[MQTT][${conn.name}] connected`)
  const client = this.ndutMqtt.instance[conn.name]
  // relay
  const relays = _.filter(config.relays || [], r => _.get(r, 'source.connection') === conn.name)
  for (const r of relays) {
    const opts = { topic: _.get(r, 'source.topic'), connection: _.get(r, 'source.connection'), relay: true }
    this.ndutMqtt.helper.subscribe(opts)
  }
  // normal subscriber
  for (const t in this.ndutMqtt.subscribe) {
    const subs = _.filter(this.ndutMqtt.subscribe[t] || [], { connection: conn.name })
    if (subs.length > 0) {
      client.subscribe(t)
      this.log.debug(`[MQTT][${conn.name}] subscribed to ${t}`)
    }
  }
}

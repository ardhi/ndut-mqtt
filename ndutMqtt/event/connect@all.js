module.exports = async function (conn) {
  const { _ } = this.ndut.helper
  this.log.debug(`[MQTT][${conn.name}] connected`)
  const client = this.ndutMqtt.instance[conn.name]
  for (const t in this.ndutMqtt.subscribe) {
    const subs = _.filter(this.ndutMqtt.subscribe[t] || [], { connection: conn.name })
    if (subs.length > 0) {
      for (const s of subs) {
        client.subscribe(t)
        this.log.debug(`[MQTT][${conn.name}] subscribed to ${t}`)
      }
    }
  }
}

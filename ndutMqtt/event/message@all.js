const handleSub = async function(s, conn, ...args) {
  const { _ } = this.ndut.helper
  if (!s.handler) return
  const result = await s.handler.call(this, ...args)
  if (_.isEmpty(result) || !s.publish) return
  if (_.isString(s.publish)) s.publish = [{ topic: s.publish, connection: conn.name }]
  for (const r of publish) {
    try {
      this.ndutMqtt.helper.publish(r.topic, result, r.connection)
    } catch (err) {}
  }
}

const handleRelay = async function(s, conn, ...args) {
  const { _, getNdutConfig } = this.ndut.helper
  const config = getNdutConfig('ndutMqtt')
  const [topic, message] = args
  const relays = _.filter(config.relays, r => {
    return _.get(r, 'source.topic') === topic && _.get(r, 'source.connection') === conn.name
  })
  for (const r of relays) {
    const dconn = _.get(r, 'destination.connection')
    const dtopic = _.get(r, 'destination.topic', topic)
    let dmsg = message.toString()
    try {
      dmsg = JSON.parse(dmsg)
    } catch (err) {}
    dmsg.source = r.source.connection
    if (r.converter) {
      const [ns, fn] = (r.converter.includes(':') ? r.converter : ('app:' + r.converter)).split(':')
      dmsg = await this[ns].helper[fn](dmsg, r)
    }
    this.ndutMqtt.helper.publish(dtopic, dmsg, dconn)
  }
}

module.exports = async function (conn, ...args) {
  const { _ } = this.ndut.helper
  const [topic] = args
  const subs = _.filter(this.ndutMqtt.subscribe[topic] || [], s => {
    return ['all', conn.name].includes(s.connection)
  })
  if (subs.length === 0) return
  for (const s of subs) {
    if (s.relay) await handleRelay.call(this, s, conn, ...args)
    else await handleSub.call(this, s, conn, ...args)
  }
}

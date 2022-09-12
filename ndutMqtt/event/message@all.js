module.exports = async function (conn, ...args) {
  const { _ } = this.ndut.helper
  const [topic] = args
  const subs = _.filter(this.ndutMqtt.subscribe[topic] || [], { connection: conn.name })
  if (subs.length === 0) return
  for (const s of subs) {
    await s.handler.call(this, ...args)
  }
}

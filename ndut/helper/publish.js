module.exports = async function (topic, message, conn = 'default') {
  const { _ } = this.ndut.helper
  const client = this.ndutMqtt.instance[conn]
  if (!client) throw new Error(`[MQTT] no such connection '${conn}`)
  client.publish(topic, _.isPlainObject(message) || _.isArray(message) ? JSON.stringify(message) : message)
}

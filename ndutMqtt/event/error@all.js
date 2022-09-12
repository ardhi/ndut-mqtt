module.exports = async function (conn, error) {
  this.log.warn(`[MQTT][${conn.name}] Error: ${error.message}`)
}

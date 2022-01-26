module.exports = async function (conn, error) {
  this.log.warn(`[MQTT][${conn}] Error: ${error.message}`)
}

const path = require('path')

const mqttEvents = ['connect', 'reconnect', 'close', 'disconnect', 'offline', 'error', 'end',
  'message', 'packetsend', 'packetreceive']

const plugin = async function (scope, options) {
  const { _, fastGlob, getNdutConfig, getConfig, aneka } = scope.ndut.helper
  const { mqtt } = scope.ndutMqtt.helper
  const config = getConfig()
  const instance = {}
  const event = {}

  for (const n of config.nduts) {
    const cfg = getNdutConfig(n)
    const files = await fastGlob(`${cfg.dir}/ndutMqtt/event/*.js`)
    for (const f of files) {
      let [base, conn] = path.basename(f, '.js').split('@')
      if (!mqttEvents.includes(base)) continue
      if (!conn) conn = 'default'
      let mod = require(f)
      if (_.isFunction(mod)) mod = { handler: mod }
      if (!mod.handler) throw new Error('No handler provided')
      if (!event[base]) event[base] = []
      if (conn === 'all') conn = _.map(options.connections, 'name')
      else conn = conn.split(',')
      for (const c of conn) {
        event[base].push(_.merge({}, mod, { connection: c }))
      }
    }
  }

  for (const n of config.nduts) {
    const cfg = getNdutConfig(n)
    const files = await fastGlob(`${cfg.dir}/ndutMqtt/subscribe/*.js`)
    // TODO: topic with special chars
    for (const f of files) {
      let [base, conn] = path.basename(f, '.js').split('@')
      base = base.replace(/\-/g, '/') // base = topic
      if (!conn) conn = 'default'
      let mod = require(f)
      let topic = base
      let handler
      if (_.isFunction(mod.topic)) topic = await mod.topic.call(scope)
      if (_.isFunction(mod)) handler = mod
      else handler = mod.handler
      if (!handler) continue
      if (!topic) continue
      await scope.ndutMqtt.helper.subscribe(topic, handler, conn)
    }
  }

  for (const c of options.connections) {
    if (!c.options.clientId) c.options.clientId = scope.ndutDb.helper.generateId()
    const client = mqtt.connect(c.url, c.options)
    for (const evt of mqttEvents) {
      client.on(evt, (...args) => {
        const evts = _.filter(event[evt] || [], { connection: c.name })
        if (evts.length > 0) {
          for (const e of evts) {
            e.handler.call(scope, c, ...args).then().catch(err => {})
          }
        }
      })
    }
    instance[c.name] = client
  }

  scope.ndutMqtt.instance = instance
  scope.addHook('onClose', async (scp, done) => {
    Promise.all(_.map(_.keys(instance), i => {
      return new Promise((resolve, reject) => {
        scope.log.debug(`Closing MQTT connection '${i}'`)
        instance[i].end(true) // do we have to wait?
        resolve()
      })
    })).then(() => {
      done()
    })
  })
}

module.exports = async function () {
  const { fp } = this.ndut.helper
  return fp(plugin)
}

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
      _.each(conn, c => {
        mod.connection = c
        event[base].push(mod)
      })
    }
  }

  const filterEvent = (name, filter, ...args) => {
    const evts = _.filter(event[name] || [], filter)
    return Promise.all(_.map(evts, evt => {
      return evt.handler.call(scope, ...args)
    }))
  }

  for (const c of options.connections) {
    const client = mqtt.connect(c.url, c.options)
    for (const evt of mqttEvents) {
      client.on(evt, (...args) => {
        if (evt === 'connect' && c.subscribe) {
          client.subscribe(c.subscribe.topic, c.subscribe.options, err => {
            if (err) scope.log.error(`[MQTT][${c.name}] Subscribe error: ${err.message}`)
          })
        }
        filterEvent(evt, { connection: c.name }, c.name, ...args)
          .then()
          .catch(err => {
            // console.log(err)
          })
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

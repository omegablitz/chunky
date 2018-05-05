const NodeRSA = require('node-rsa')
const path = require('path')

const Proxy = require('./Proxy')

const mcProtocolPath = require.resolve('minecraft-protocol')
const localServerPlugins = [
  require(path.join(mcProtocolPath, '../server/handshake')),
  require(path.join(mcProtocolPath, '../server/login')),
  require(path.join(mcProtocolPath, '../server/ping'))
]

const proxyPlugins = [
  require('./Plugins/ChatCommands')
]

/**
 * Create a new proxy
 * @param {Object} localServerOptions Settings for the minecraft-protocol server
 * @param {Object} serverList An object that maps a 'serverName' to the server info
 * @returns {MinecraftProxy} A new Minecraft proxy
 */
function createProxy (localServerOptions = {}, serverList = {}, proxyOptions = {}) {
  const {
    host = '0.0.0.0',
    'server-port': serverPort,
    port = serverPort || 25565,
    motd = 'A Minecraft server',
    'max-players': maxPlayers = 20,
    version,
    favicon,
    customPackets
  } = localServerOptions

  const {
    enablePlugins = true
  } = proxyOptions

  const optVersion = version === undefined || version === false ? require(path.join(mcProtocolPath, '../version')).defaultVersion : version

  const mcData = require('minecraft-data')(optVersion)
  const mcversion = mcData.version

  const serverOptions = {
    version: mcversion.minecraftVersion,
    customPackets: customPackets
  }

  const proxy = new Proxy(serverOptions, serverList, proxyOptions)
  proxy.mcversion = mcversion
  proxy.motd = motd
  proxy.maxPlayers = maxPlayers
  proxy.playerCount = 0
  proxy.onlineModeExceptions = {}
  proxy.favicon = favicon
  proxy.serverKey = new NodeRSA({b: 1024})

  proxy.on('connection', function (client) {
    localServerPlugins.forEach((plugin) => plugin(client, proxy, localServerOptions, proxyOptions))
    if (enablePlugins) proxyPlugins.forEach((plugin) => plugin(client, proxy, localServerOptions, proxyOptions))
  })

  proxy.listen(port, host)
  return proxy
}

module.exports = createProxy

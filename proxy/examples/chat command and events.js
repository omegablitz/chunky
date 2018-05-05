const McProxy = require('../')

/*
  CREATING PROXY
*/

let localServerOptions = {
  'port': '25578',
  'version': '1.12.1',
  'online-mode': false,
  'motd': 'nodejs minecraft proxy'
}

let serverList = {
  hub: {
    host: 'localhost',
    port: 25565,
    isDefault: true,
    isFallback: true
  },
  minigames: {
    host: 'localhost',
    port: 25566
  }
}

let proxyOptions = {
  // enables the plugins stored in the /src/Plugins folder, for now the only plugin is the command handler plugin
  enablePlugins: true
}

/*
  Use the "/server <serverName>" command in chat to move between servers.
  <serverName> is the name that you chose for the server inside the serverList
  This command is implemented by /src/Plugins/ChatCommands.js and it can be disabled by setting enablePlugin: false inside proxyOptions
*/
let proxy = McProxy.createProxy(localServerOptions, serverList, proxyOptions)

/*
  HANDLING EVENTS
*/

proxy.on('error', console.error)

proxy.on('listening', () => {
  console.info('Listening!')
})

proxy.on('login', (player) => {
  console.info(`${player.username} connected from ${player.socket.remoteAddress}`)

  player.on('end', () => {
    console.info(`${player.username} disconnected: ${player.socket.remoteAddress}`)
  })

  player.on('error', (err) => {
    console.error(`${player.username} disconnected with error: ${player.socket.remoteAddress}`, err)
  })
})

proxy.on('moveFailed', (err, playerId, oldServerName, newServerName) => {
  console.error(`Player ${proxy.clients[playerId].username} failed to move from ${oldServerName} to ${newServerName}`, err)
})

proxy.on('playerMoving', (playerId, oldServerName, newServerName) => {
  console.info(`Player ${proxy.clients[playerId].username} is moving from ${oldServerName} to ${newServerName}`)
})

proxy.on('playerMoved', (playerId, oldServerName, newServerName) => {
  console.info(`Player ${proxy.clients[playerId].username} has moved from ${oldServerName} to ${newServerName}`)
})

proxy.on('playerFallback', (playerId, oldServerName, newServerName) => {
  console.info(`Player ${proxy.clients[playerId].username} is falling back from ${oldServerName} to ${newServerName}`)
})

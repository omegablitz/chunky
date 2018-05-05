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
  // the proxy won't automatically connect players to the default server
  autoConnect: false,
  // the proxy won't automatically move players to the fallback server when they get kicked
  autoFallback: false
}

/*
  Use the "/server <serverName>" command in chat to move between servers.
  <serverName> is the name that you chose for the server inside the serverList
  This command is implemented by /src/Plugins/ChatCommands.js and it can be disabled by setting enablePlugin: false inside proxyOptions
*/
let proxy = McProxy.createProxy(localServerOptions, serverList, proxyOptions)

proxy.on('login', (client) => {
  console.info('Player joined')

  // when player joins connect him to a server manually
  proxy.setRemoteServer(client.id, 'hub')
})

proxy.on('playerFallback', (remoteClientId, oldServerName, fallbackServerName) => {
  console.info(`Fallback from ${oldServerName}`)
  proxy.setRemoteServer(remoteClientId, fallbackServerName)
})

proxy.on('listening', () => {
  console.info('listening!')
})

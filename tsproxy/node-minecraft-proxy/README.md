# node-minecraft-proxy

Simple Minecraft proxy written in Node.js using the node-minecraft-protocol library

- [node-minecraft-proxy](#node-minecraft-proxy)
  - [Features](#features)
  - [Installation](#installation)
  - [Examples](#examples)
    - [Creating a proxy](#creating-a-proxy)
    - [Moving players from a server to another](#moving-players-from-a-server-to-another)
  - [Documentation](#documentation)

## Features

- Connect to proxy
- Forward players to servers
- Change server
- Basic plugin support, see `./src/Plugins/ChatCommands.js` for an example

## Installation

`npm install basic-minecraft-proxy`

## Examples

See also `./examples/` for other examples

### Creating a proxy

This example shows how to create a new proxy and how to the options are passed.

```js
const McProxy = require('minecraft-proxy');

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

// if you leave proxyOptions empty yo may as well not pass it in the arguments, I wrote it anyway to point out that it exist
let proxyOptions = {}

/*
  Use the "/server <serverName>" command in chat to move between servers.
  <serverName> is the name that you chose for the server inside the serverList
  This command is implemented by /src/Plugins/ChatCommands.js and it can be disabled by setting enablePlugin: false inside proxyOptions
*/
let proxy = McProxy.createProxy(localServerOptions, serverList, proxyOptions);

proxy.on('error', console.error);

proxy.on('listening', () => {
  console.info('Listening!');
});
```

### Moving players from a server to another

In this example every player will be moved from the `hub` server (default) to the `minigames` server 30 seconds after having logged in.

```js
proxy.on('login', (player) => {
  setTimeout(() => {
    proxy.setRemoteServer(player.id, "minigames");
  }, 30 * 1000);
});
```

## Documentation

See the [wiki](https://github.com/7ixi0/node-minecraft-proxy/wiki).

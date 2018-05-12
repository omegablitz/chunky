const util = require('./util.js');
const createProxy = require('./proxy/createProxy.js');

const localServerOptions = {
    'port': '4444',
    'version': '1.12.2',
    'online-mode': false,
    'motd': 'chunky!'
}
const proxyServers = {}
const proxyOptions = {
    autoConnect: false,
}


const coordinator = require('net').Socket();
console.log("attempting to connect to coordinator at", process.env.COORDINATOR_ADDR, process.env.COORDINATOR_PORT);
coordinator.connect(process.env.COORDINATOR_PORT, process.env.COORDINATOR_ADDR);

coordinator.on('connect', function() {
    console.log('connected to coordinator')
    const proxy = createProxy(localServerOptions, proxyServers, proxyOptions);

    // Maps id to player info object
    const playerMap = {};

    proxy.on('login', (player) => {
        console.log(player.username + ' logged in');
        playerMap[player.uuid] = {
            id: player.id,
            username: player.username,
        }
        coordinator.write(JSON.stringify({
            route: '/login',
            player: player.uuid,
        }) + '\n');
    });

    proxy.on('error', console.error);

    proxy.on('listening', () => {
        console.info('Proxy listening!');
    });


    util.emitLines(coordinator);
    coordinator.on('line', function(line) {
        const data = JSON.parse(line.toString().trim());
        switch (data.route) {
            case '/connect':
                const host = data.host;
                const playerUUIDs = data.players;
                if (!(host in proxyServers)) {
                    proxyServers[host] = {
                        host: host.split(':')[0],
                        port: host.split(':')[1],
                    }
                }
                console.log("swapping", playerUUIDs, "to", host);
                for (let playerUUID of playerUUIDs) {
                    proxy.setRemoteServer(playerMap[playerUUID].id, host);
                }
                break;
            default:
                console.log("unknown message: ", data);
        }
    });
});


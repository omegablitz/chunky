const util = require('./util.js');
const createProxy = require('./proxy/createProxy.js');
const Clusters = require('./clusters.js');

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

const proxy = createProxy(localServerOptions, proxyServers, proxyOptions);

// Maps id to player info object
const playerMap = {};

proxy.on('login', (player) => {
    console.log(player.username + ' logged in');
    playerMap[player.uuid] = {
        id: player.id,
        username: player.username,
    }
    if (Object.keys(proxyServers).length > 0) {
        proxy.setRemoteServer(player.id, util.randomKey(proxyServers));
    }
});

proxy.on('error', console.error);

proxy.on('listening', () => {
    console.info('Listening!');
});



var net = require('net');
var HOST = '0.0.0.0';
var PORT = 4445;

const clusters = new Clusters();
const chunkState = clusters.chunkState;
const serverData = {};


// maps TXN id -> data
const flushData = {}

const NUM_SERVERS = 2;
let serversLoaded = 0;

net.createServer(function (sock) {
    const host = sock.remoteAddress + ':' + sock.remotePort;
    proxyServers[host] = {
        host: sock.remoteAddress,
        port: 25565,
    }
    serverData[host] = {
        sock: sock,
    };
    if (Object.keys(serverData).length == NUM_SERVERS) {
        startCycle();
    }


    console.log('CONNECTED: ' + sock.remoteAddress + ':' + sock.remotePort);
    console.log('new proxyServers: ' + JSON.stringify(proxyServers));

    if (Object.keys(proxyServers).length === 1) {
        for (let player in playerMap) {
            proxy.setRemoteServer(playerMap[player].id, host);
        }
    }


    util.emitLines(sock);
    sock.on('line', function (line) {
        const data = JSON.parse(line.toString().trim())
        switch (data.route) {
            case '/loaded':
                clusters.updateLoaded(host, data.chunks);
                serversLoaded++;
                if (serversLoaded == Object.keys(proxyServers).length) {
                    serversLoaded = 0;
                    cycleTransfer();
                    setTimeout(startCycle, 1000);
                }
                swapPlayers(host, data.players);
                break;
            case '/flush':
                const txn = flushData[data.id];
                setTimeout(function() {

                serverData[txn.to].sock.write(JSON.stringify({
                    route: '/load',
                    chunks: txn.chunks,
                }) + '\n');
                }, 500);
                for (let chunk of txn.chunks) {
                    chunkState.removeOwner(chunk[0], chunk[1]);
                    chunkState.setOwner(chunk[0], chunk[1], txn.to);
                }
                for (let uuid in data.players) {
                    // TODO swap
                    proxy.setRemoteServer(playerMap[uuid].id, txn.to);
                }
                delete flushData[data.id];
                break;
        }
    });

    sock.on('close', function (data) {
        console.log('CLOSED: ' + sock.remoteAddress + ' ' + sock.remotePort);
    });

}).listen(PORT, HOST);

const swapPlayers = function (server, players) {
    for (let player in players) {
        const chunk = players[player];
        console.log(server, 'checking if chunk is owned');
        if (chunkState.isOwned(chunk[0], chunk[1])) {
            const chunkOwner = chunkState.getOwner(chunk[0], chunk[1]);
        console.log('chunk is owned by', chunkOwner, 'i-am', server);
            if (server !== chunkOwner) {
                console.log('swapping', player, 'to correct server');
                // swap
                proxy.setRemoteServer(playerMap[player].id, chunkOwner);
            }
        }
    }
}

const startCycle = function () {
    if (Object.keys(serverData).length <= 1) {
        return;
    }
    for (let server in serverData) {
        const sock = serverData[server].sock;
        sock.write(JSON.stringify({
            route: '/loaded',
            owned: Object.values(chunkState.getServerOwned(server)),
        }) + '\n');
    }
};

const cycleTransfer = function () {
    const transfers = clusters.getTransfers(Object.keys(proxyServers));
    //if (Object.keys(transfers).length > 0)
    //    console.log('transfers', JSON.stringify(transfers));
    for (let transfer of Object.values(transfers)) {
        const from = transfer.from;
        const to = transfer.to;
        const chunks = Object.values(transfer.chunks);

        const fromServerSock = serverData[from].sock;
        const toServerSock = serverData[to].sock;

        const id = Math.random().toString(36).substring(2);

        flushData[id] = {
            chunks: chunks,
            to: to,
            from: from,
        };
        fromServerSock.write(JSON.stringify({
            route: '/flush',
            chunks: chunks,
            id: id,
        }) + '\n');
    }
}

console.log('Server listening on ' + HOST + ':' + PORT);

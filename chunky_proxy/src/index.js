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
// Maps server host to list of chunks that server is responsible for
const serverChunks = {};

proxy.on('login', (player) => {
  console.log(player.username + ' logged in');
  playerMap[player.uuid] = {
      id: player.id,
      username: player.username,
  }
  proxy.setRemoteServer(player.id, util.randomKey(proxyServers));
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


net.createServer(function (sock) {
    const host = sock.remoteAddress + ':' + sock.remotePort;
    proxyServers[host] = {
        host: sock.remoteAddress,
        port: 25565,
    }
    serverData[host] = {
        sock: sock,
    };


    console.log('CONNECTED: ' + sock.remoteAddress + ':' + sock.remotePort);
    console.log('new proxyServers: ' + JSON.stringify(proxyServers));

    setInterval(function() {
        sock.write(JSON.stringify({'route': '/loaded'}) + '\n');
    }, 2000);

    util.emitLines(sock);
    sock.on('line', function (line) {
        console.log(line.toString().trim());
        data = JSON.parse(line.toString().trim())
        switch(data.route) {
            case '/loaded':
                clusters.updateLoaded(host, data.chunks);
                const transfers = clusters.getTransfers(Object.keys(proxyServers));
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
                //const log = [];
                //for (let blob of clusters.blobs) {
                //    console.log(blob);
                //    //console.log('blob len: ' + Object.keys(blob).length);
                //    log.push(Object.values(blob));
                //}
                console.log('number of blobs: ' + clusters.blobs.length)
                break;
            case '/flush':
                const txn = flushData[data.id];
                serverData[txn.to].sock.write(JSON.stringify({
                    route: '/load',
                    chunks: txn.chunks,
                }) + '\n');
                console.log(chunkState.owned_chunks);
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

console.log('Server listening on ' + HOST +':'+ PORT);

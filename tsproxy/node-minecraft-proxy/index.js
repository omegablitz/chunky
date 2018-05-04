let localServerOptions = {
    'port': '4444',
    'version': '1.12.2',
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
        port: 25564
    }
}

// if you leave proxyOptions empty yo may as well not pass it in the arguments, I wrote it anyway to point out that it exist
let proxyOptions = {}

/*
  Use the "/server <serverName>" command in chat to move between servers.
  <serverName> is the name that you chose for the server inside the serverList
  This command is implemented by /src/Plugins/ChatCommands.js and it can be disabled by setting enablePlugin: false inside proxyOptions
*/
let proxy = require('./src/createProxy.js')(localServerOptions, serverList, proxyOptions);

proxy.on('error', console.error);

proxy.on('listening', () => {
    console.info('Listening!');
});



var net = require('net');
var HOST = '127.0.0.1';
var PORT = 4445;

// Create a server instance, and chain the listen function to it
// The function passed to net.createServer() becomes the event handler for the 'connection' event
// The sock object the callback function receives UNIQUE for each connection
var next = "minigames";
sockLookup = []
net.createServer(function (sock) {
    sockLookup.push(sock)

    // We have a connection - a socket object is assigned to the connection automatically
    console.log('CONNECTED: ' + sock.remoteAddress + ':' + sock.remotePort);

    // Add a 'data' event handler to this instance of socket
    sock.on('data', function (data) {
        console.log('DATA ' + sock.remoteAddress + ': ' + data);

        // Write the data back to the socket, the client will receive it as data from the server
        dat = JSON.parse(data.toString().trim())
        proxy.setRemoteServer('0', next)
        next = next == "hub" ? "minigames" : "hub";

        otherServ = sockLookup[0] == sock ? sockLookup[1] : sockLookup[0];
        otherServ.write(data);
    });

    // Add a 'close' event handler to this instance of socket
    sock.on('close', function (data) {
        console.log('CLOSED: ' + sock.remoteAddress + ' ' + sock.remotePort);
    });

}).listen(PORT, HOST);

console.log('Server listening on ' + HOST +':'+ PORT);

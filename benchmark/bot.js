var mineflayer = require('mineflayer');
var config = require('./config.json');

var id = parseInt(process.argv[2]);

get_random = function (list) {
    return list[Math.floor((Math.random()*list.length))];
  }

var bot = mineflayer.createBot({
  host: config.server,
  port: config.port,
  username: "benchmark_bot_" + id,
  verbose: true,
  version: "1.12"
});

bot.on('spawn', function() {
  setTimeout(function() {
    bot.chat('login');
  }, 5000);
});

bot.on('chat', function(username, message) {
    if (message == "start") {
        setInterval(function() {
            bot.setControlState('jump', true);
            bot.setControlState('forward', false);
            bot.setControlState('left', false);
            bot.setControlState('right', false);

            var s = get_random(['forward', 'left', 'right']);
            bot.setControlState(s, true);
        }, 2000);
    }
});

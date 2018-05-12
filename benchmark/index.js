var mineflayer = require('mineflayer');
var gen = require('random-seed');
var config = require('./config.json');
const { spawn } = require('child_process');

var rand = gen.create(1337);

var op_bot = mineflayer.createBot({
  host: config.server,
  port: config.port,
  username: "benchmark_op",
  verbose: true,
});

var i = 1;                     //  set your counter to 1

function spawnLoop () {           //  create a loop function
  setTimeout(function () {    //  call a 3s setTimeout when the loop is called
    console.log('Spawned ' + i);
    spawn('node', ['bot.js', '' + i]);         //  your code here
    i++;                     //  increment the counter
    if (i <= config.num_players) {            //  if the counter < 10, call the loop function
      spawnLoop();             //  ..  again which will trigger another 
    }                        //  ..  setTimeout()
  }, 5000)
}

function spawnOne() {
  spawn('node', ['bot.js', '' + i]);
  console.log('Spawned ' + i);
  i++;
}

op_bot.on('spawn', function() {
  // spawnLoop();
  setTimeout(spawnOne, 6000);
});

var count = 0;

op_bot.on('chat', function(username, message) {
  if (message == "login") {
    op_bot.chat("/gamemode creative " + username);
    op_bot.chat("/tp " + username + " benchmark_op");

    count++;

    if (count >= config.num_players) {
      var pos = op_bot.entity.position;
      if (config.spread) {
        op_bot.chat("/spreadplayers " + pos.x + " " + pos.z + " " + config.spread_distance + " " + config.spread_range + " false @a[name=!benchmark_op]")
      }
      op_bot.chat("start");

      setInterval(function() {
        op_bot.chat("/tps");
      }, 10000);
    } else {
      spawnOne();
    }
  }
});

op_bot.on('message', function(jsonMsg) {
  if (JSON.stringify(jsonMsg).includes('TPS')) {
    console.log(jsonMsg.extra[1].text);
  }
});

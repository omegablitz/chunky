function emitLines (stream) {
    var backlog = ''
    stream.on('data', function (data) {
      backlog += data
      var n = backlog.indexOf('\n')
      // got a \n? emit one or more 'line' events
      while (~n) {
        stream.emit('line', backlog.substring(0, n))
        backlog = backlog.substring(n + 1)
        n = backlog.indexOf('\n')
      }
    })
    stream.on('end', function () {
      if (backlog) {
        stream.emit('line', backlog)
      }
    })
}

function randomKey (obj) {
  const keys = Object.keys(obj);
  if (keys.length <= 0) {
    throw new Error('no keys in obj, cant get random key');
  }
  return keys[keys.length * Math.random() << 0];
}

function getAnyKey (obj) {
  const keys = Object.keys(obj);
  if (keys.length <= 0) {
    throw new Error('no keys in obj, cant get random key');
  }
  return keys[0];
}

function getNeighboring(chunk) {
  const out = []
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      if (x == 0 && y == 0) continue;
      out.push([chunk[0] + x, chunk[1] + y]);
    }
  }
  return out;
}


module.exports = {
  emitLines,
  randomKey,
  getNeighboring,
  getAnyKey,
}
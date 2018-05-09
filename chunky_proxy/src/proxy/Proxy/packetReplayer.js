const Queue = require('queuejs')

function replayer (remoteClient, localClient, callback) {
  let packets = new Queue()
  let sentRespawn = false

  localClient.on('packet', (data, metadata) => {
    if (!sentRespawn) {
      packets.enq({
        packet: data,
        metadata: metadata
      })
    }
  })

  localClient.on('login', (data, metadata) => {
    sentRespawn = true
    remoteClient.write('respawn', {
      dimension: data.dimension,
      difficulty: data.difficulty,
      gamemode: data.gameMode,
      levelType: data.levelType
    })

    while (packets.size > 0) {
      let element = packets.deq()
      remoteClient.write(element.metadata.name, element.packet)
    }

    callback()
  })
}

module.exports = replayer

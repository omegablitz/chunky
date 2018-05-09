const Chunks = require('./chunks');
const Util = require('./util');

class Clusters {
    constructor() {
        this.chunkState = new Chunks();
        this.blobs = [];
    }

    updateLoaded(server, chunks) {
        // dict of stringify(chunk) -> chunk
        const oldChunks = this.chunkState.getServerLoaded(server);
        const newChunks = {}
        for (let chunk of chunks) {
            newChunks[chunk] = chunk;
        }

        const unloadedChunks = [];
        const newlyLoadedChunks = [];
        for (let chunk in newChunks) {
            if (!(chunk in oldChunks)) {
                newlyLoadedChunks.push(newChunks[chunk]);
            }
        }
        for (let chunk in oldChunks) {
            if (!(chunk in newChunks)) {
                unloadedChunks.push(oldChunks[chunk]);
            }
        }

        for (let chunk of newlyLoadedChunks) {
            this.chunkState.addLoaded(chunk[0], chunk[1], server);
        }
        for (let chunk of unloadedChunks) {
            this.chunkState.removeLoaded(chunk[0], chunk[1], server);
        }

        const allLoadedChunks = this.chunkState.getAllLoadedChunks();
        const visited = {};
        const out = [];

        const dfs = function (chunk, blob) {
            if (chunk in visited) return;
            if (!(chunk in allLoadedChunks)) return;
            visited[chunk] = true;
            blob[chunk] = chunk;
            for (let neighboring of Util.getNeighboring(chunk)) {
                dfs(neighboring, blob);
            }
        };

        for (let chunkKey of Object.keys(allLoadedChunks)) {
            if (chunkKey in visited) {
                continue
            }
            const chunk = allLoadedChunks[chunkKey];
            const blob = {};
            dfs(chunk, blob);
            
            out.push(blob);
        }
        this.blobs = out;
    }

    redistribute(serverList) {
        const serverAssignments = {};
        for (let server of serverList) {
            serverAssignments[server] = {
                numChunks: 0,
                blobs: [],
            };
        }
        for (let blob of this.blobs) {
            const serverCounts = {}
            let maxServer = null;
            let maxCount = -1;
            const blobChunks = Object.values(blob)
            for (let chunk of blobChunks) {
                const servers = this.chunkState.getLoaded(chunk[0], chunk[1]);
                for (let server in servers) {
                    if (!(server in serverCounts)) {
                        serverCounts[server] = 0;
                    }
                    serverCounts[server]++;
                    if (serverCounts[server] > maxCount) {
                        maxServer = server;
                        maxCount = serverCounts[server];
                    }
                }
            }
            serverAssignments[maxServer].numChunks += blobChunks.length;
            serverAssignments[maxServer].blobs.push(blob);
        }
        if (serverList.length == 1) {
            return serverAssignments;
        }
        while (true) {
            let minChunkServer = null;
            let minChunkNumber = Number.MAX_SAFE_INTEGER;

            let maxChunkServer = null;
            let maxChunkNumber = -1;
            let maxChunkLastBlobSize = null;
            for (let server in serverAssignments) {
                const assignment = serverAssignments[server];
                if (assignment.numChunks < minChunkNumber) {
                    minChunkServer = server;
                    minChunkNumber = assignment.numChunks;
                }
                if (assignment.numChunks > maxChunkNumber) {
                    if (assignment.blobs.length == 0) {
                        continue
                    }
                    maxChunkServer = server;
                    maxChunkNumber = assignment.numChunks;
                    maxChunkLastBlobSize = Object.keys(assignment.blobs[assignment.blobs.length - 1]).length;
                }
            }
            if (maxChunkNumber - maxChunkLastBlobSize < minChunkNumber + maxChunkLastBlobSize) {
                break;
            }
            serverAssignments[minChunkServer].blobs.push(serverAssignments[maxChunkServer].blobs.pop());
        }
        return serverAssignments;
    }

    getTransfers(serverList) {
        const newServerAssignments = this.redistribute(serverList);

        const transfers = {};
        for (let server in newServerAssignments) {
            const assignment = newServerAssignments[server];
            for (let blob of assignment.blobs) {
                for (let chunkKey in blob) {
                    const chunk = blob[chunkKey];
                    if (this.chunkState.isOwned(chunk[0], chunk[1])) {
                        const previousOwner = this.chunkState.getOwner(chunk[0], chunk[1]);
                        if (previousOwner == server) {
                            // do nothing, we already own it
                        } else {
                            // we don't own the chunk, transfer ownership
                            console.log(chunkKey + ' owned by ' + previousOwner);
                            const key = {
                                from: previousOwner,
                                to: server,
                            };
                            if (!(key in transfers)) {
                                transfers[key] = {
                                    from: key.from,
                                    to: key.to,
                                    chunks: [],
                                };
                            }
                            transfers[key].chunks.push(chunk);
                        }
                    } else {
                        // nobody owns it - we need to set ownership
                        this.chunkState.setOwner(chunk[0], chunk[1], server);
                    }
                }
            }
        }
        return transfers;
    }
}

module.exports = Clusters;
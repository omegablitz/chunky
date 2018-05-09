class Chunks {
    constructor() {
        this.servers = {};

        // loaded_chunks is mapping from {stringify(chunk) -> {stringify(server) -> server}}
        this.loaded_chunks = {}


        this.owned_chunks = {}
    }

    isOwned(chunkX, chunkY) {
        return [chunkX, chunkY] in this.owned_chunks;
    }

    getOwner(chunkX, chunkY) {
        if (!this.isOwned(chunkX, chunkY)) {
            throw new Error('chunk ' + chunkX + ',' + chunkY + ' has no owner');
        }
        return this.owned_chunks[[chunkX, chunkY]];
    }

    setOwner(chunkX, chunkY, server) {
        const key = [chunkX, chunkY];
        if (this.isOwned(chunkX, chunkY)) {
            throw new Error('chunk ' + key + ' is already owned!');
        }
        this.owned_chunks[key] = server;

        this._initializeServer(server);
        this.servers[server].owned[key] = key;

    }

    removeOwner(chunkX, chunkY) {
        const key = [chunkX, chunkY];
        if (!this.isOwned(chunkX, chunkY)) {
            throw new Error('chunk ' + key + ' was not owned');
        }
        const server = this.owned_chunks[key];
        delete this.owned_chunks[key];
        delete this.servers[server].owned[key];
    }

    isLoaded(chunkX, chunkY) {
        return [chunkX, chunkY] in this.loaded_chunks;
    }

    getLoaded(chunkX, chunkY) {
        if (!this.isLoaded(chunkX, chunkY)) {
            throw new Error('chunk ' + chunkX + ',' + chunkY + ' is not loaded');
        }
        return this.loaded_chunks[[chunkX, chunkY]];
        // return Object.values(this.loaded_chunks[[chunkX, chunkY]]);
    }

    addLoaded(chunkX, chunkY, server) {
        const key = [chunkX, chunkY];
        if (!this.isLoaded(chunkX, chunkY)) {
            this.loaded_chunks[key] = {};
        }
        const loaded_chunk_servers = this.loaded_chunks[key];
        if (server in loaded_chunk_servers) {
            throw new Error('server ' + server + ' already has ' + key + ' loaded');
        }

        this._initializeServer(server);
        this.servers[server].loaded[key] = key;
        this.loaded_chunks[key][server] = server;
    }

    removeLoaded(chunkX, chunkY, server) {
        const key = [chunkX, chunkY];
        if (!this.isLoaded(chunkX, chunkY)) {
            throw new Error('no server has ' + key + ' loaded, cant remove a server from it');
        }
        const loaded_chunk_servers = this.loaded_chunks[key];
        if (!(server in loaded_chunk_servers)) {
            throw new Error('server ' + server + ' does not have ' + key + ' loaded, cant remove a server from it');
        }
        delete this.servers[server].loaded[key];
        delete loaded_chunk_servers[server];
        if (Object.keys(loaded_chunk_servers).length == 0) {
            delete this.loaded_chunks[key];
        }
    }

    // must return new obj
    getAllLoadedChunks() {
        const out = {}
        for (let chunk in this.loaded_chunks) {
            const spl = chunk.split(',');
            out[chunk] = [parseInt(spl[0]), parseInt(spl[1])];
        }
        return out;
    }

    getServerLoaded(server) {
        this._initializeServer(server);
        return this.servers[server].loaded;
        //return Object.values(this.servers[server].loaded);
    }

    getServerOwned(server) {
        this._initializeServer(server);
        return this.servers[server].owned;
        //return Object.values(this.servers[server].owned);
    }


    _initializeServer(server) {
        if (!(server in this.servers)) {
            this.servers[server] = {
                loaded: {},
                owned: {},
            };
        }
    }
}

module.exports = Chunks;
package main

import "fmt"

type chunkManager struct {
	owned   map[Chunk]Server
	loaded  map[Chunk]map[Server]struct{}
	servers map[Server]*serverStatus
}

func NewChunkManger() *chunkManager {
	return &chunkManager{
		owned:   make(map[Chunk]Server),
		loaded:  make(map[Chunk]map[Server]struct{}),
		servers: make(map[Server]*serverStatus),
	}
}

type serverStatus struct {
	owned  map[Chunk]struct{}
	loaded map[Chunk]struct{}
}

func (cm *chunkManager) isOwned(chunk Chunk) bool {
	_, ok := cm.owned[chunk]
	return ok
}

func (cm *chunkManager) getOwner(chunk Chunk) Server {
	owner, ok := cm.owned[chunk]
	if !ok {
		panic("tried to getOwner of a chunk without an owner")
	}
	return owner
}

func (cm *chunkManager) setOwner(chunk Chunk, server Server) {
	if cm.isOwned(chunk) {
		panic(fmt.Sprintf("tried to set owner of %#v which alred has an owner", chunk))
	}
	cm.owned[chunk] = server

	if _, ok := cm.servers[server]; !ok {
		cm.servers[server] = &serverStatus{
			owned:  make(map[Chunk]struct{}),
			loaded: make(map[Chunk]struct{}),
		}
	}
	cm.servers[server].owned[chunk] = struct{}{}
}

func (cm *chunkManager) removeOwner(chunk Chunk) {
	owner := cm.getOwner(chunk)
	delete(cm.owned, chunk)
	delete(cm.servers[owner].owned, chunk)
}

func (cm *chunkManager) isLoaded(chunk Chunk) bool {
	_, ok := cm.loaded[chunk]
	return ok
}

func (cm *chunkManager) getLoadedServers(chunk Chunk) map[Server]struct{} {
	servers, ok := cm.loaded[chunk]
	if !ok {
		panic(fmt.Sprintf("chunk %#v is not loaded, can't get loaded servers", chunk))
	}
	return servers
}

func (cm *chunkManager) addLoadedServer(chunk Chunk, server Server) {
	if !cm.isLoaded(chunk) {
		cm.loaded[chunk] = make(map[Server]struct{})
	}
	servers := cm.loaded[chunk]
	if _, ok := servers[server]; ok {
		panic(fmt.Sprintf("server %s already has chunk %#v loaded", server, chunk))
	}
	servers[server] = struct{}{}

	if _, ok := cm.servers[server]; !ok {
		cm.servers[server] = &serverStatus{
			owned:  make(map[Chunk]struct{}),
			loaded: make(map[Chunk]struct{}),
		}
	}
	cm.servers[server].loaded[chunk] = struct{}{}
}

func (cm *chunkManager) removeLoadedServer(chunk Chunk, server Server) {
	servers := cm.getLoadedServers(chunk)
	if _, ok := servers[server]; !ok {
		panic(fmt.Sprintf("server %s does not have chunk %#v loaded, can't remove loaded server", server, chunk))
	}
	delete(servers, server)
	delete(cm.servers[server].loaded, chunk)
	if len(cm.loaded[chunk]) == 0 {
		delete(cm.loaded, chunk)
	}
}

func (cm *chunkManager) getAllLoadedChunks() map[Chunk]struct{} {
	out := make(map[Chunk]struct{})
	for chunk := range cm.loaded {
		out[chunk] = struct{}{}
	}
	return out
}

func (cm *chunkManager) getServerLoadedChunks(server Server) map[Chunk]struct{} {
	if _, ok := cm.servers[server]; !ok {
		cm.servers[server] = &serverStatus{
			owned:  make(map[Chunk]struct{}),
			loaded: make(map[Chunk]struct{}),
		}
	}
	out := make(map[Chunk]struct{})
	for chunk := range cm.servers[server].loaded {
		out[chunk] = struct{}{}
	}
	return out
}

func (cm *chunkManager) getServerOwnedChunks(server Server) map[Chunk]struct{} {
	if _, ok := cm.servers[server]; !ok {
		cm.servers[server] = &serverStatus{
			owned:  make(map[Chunk]struct{}),
			loaded: make(map[Chunk]struct{}),
		}
	}
	out := make(map[Chunk]struct{})
	for chunk := range cm.servers[server].owned {
		out[chunk] = struct{}{}
	}
	return out
}

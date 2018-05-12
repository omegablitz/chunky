package main

import (
	"math"
	"sync"
)

type clusters struct {
	sync.Mutex
	chunkState *chunkManager
	blobs      []map[Chunk]struct{}
}

func NewClusters() *clusters {
	return &clusters{
		chunkState: NewChunkManger(),
	}
}

func (cl *clusters) UpdateLoadedChunks(server Server, chunks []Chunk) {
	cl.Lock()
	defer cl.Unlock()

	oldLoadedChunks := cl.chunkState.getServerLoadedChunks(server)
	currentLoadedChunks := make(map[Chunk]struct{})
	for _, chunk := range chunks {
		currentLoadedChunks[chunk] = struct{}{}
	}

	newLoadedChunks, unloadedChunks := chunkChanges(oldLoadedChunks, currentLoadedChunks)
	for chunk := range newLoadedChunks {
		cl.chunkState.addLoadedServer(chunk, server)
	}
	for chunk := range unloadedChunks {
		cl.chunkState.removeLoadedServer(chunk, server)
	}

	var blobs []map[Chunk]struct{}
	allLoadedChunks := cl.chunkState.getAllLoadedChunks()

	visited := make(map[Chunk]struct{})
	var dfs func(chunk Chunk, blob map[Chunk]struct{})
	dfs = func(chunk Chunk, blob map[Chunk]struct{}) {
		if _, ok := visited[chunk]; ok {
			return
		}
		if _, ok := allLoadedChunks[chunk]; !ok {
			return
		}
		visited[chunk] = struct{}{}
		blob[chunk] = struct{}{}
		for _, neighboring := range chunk.getNeighboring() {
			dfs(neighboring, blob)
		}
	}

	for chunk := range allLoadedChunks {
		if _, ok := visited[chunk]; ok {
			continue
		}
		blob := make(map[Chunk]struct{})
		dfs(chunk, blob)
		blobs = append(blobs, blob)
	}
	cl.blobs = blobs
}

type ServerAssignment struct {
	NumChunks int
	Blobs     []map[Chunk]struct{}
}

func (cl *clusters) redistribute(serverList []Server) map[Server]*ServerAssignment {
	assignments := make(map[Server]*ServerAssignment)
	for _, server := range serverList {
		assignments[server] = new(ServerAssignment)
	}

	for _, blob := range cl.blobs {
		// assign blobs to servers that have the most of the blob already loaded
		serverLoadedCounts := make(map[Server]int)
		var maxServer Server
		var maxCount int
		for chunk := range blob {
			loadedServers := cl.chunkState.getLoadedServers(chunk)
			for server := range loadedServers {
				if _, ok := serverLoadedCounts[server]; !ok {
					serverLoadedCounts[server] = 0
				}
				serverLoadedCounts[server]++
				if serverLoadedCounts[server] > maxCount {
					maxServer = server
					maxCount = serverLoadedCounts[server]
				}
			}
		}
		assignments[maxServer].NumChunks += len(blob)
		assignments[maxServer].Blobs = append(assignments[maxServer].Blobs, blob)
	}
	if len(serverList) == 1 {
		return assignments
	}

	// do rebalancing to handle skew
	for {
		var minChunkServer Server
		minChunkNumber := math.MaxInt64

		var maxChunkServer Server
		maxChunkNumber := math.MinInt64
		var maxChunkLastBlobSize int
		for server, assignment := range assignments {
			if assignment.NumChunks < minChunkNumber {
				minChunkServer = server
				minChunkNumber = assignment.NumChunks
			}
			if assignment.NumChunks > maxChunkNumber {
				if len(assignment.Blobs) == 0 {
					continue
				}
				maxChunkServer = server
				maxChunkNumber = assignment.NumChunks
				maxChunkLastBlobSize = len(assignment.Blobs[len(assignment.Blobs)-1])
			}
		}
		if maxChunkNumber-maxChunkLastBlobSize < minChunkNumber+maxChunkLastBlobSize {
			break
		}
		maxChunkBlobs := assignments[maxChunkServer].Blobs
		var lastBlob map[Chunk]struct{}
		assignments[maxChunkServer].Blobs, lastBlob = maxChunkBlobs[:len(maxChunkBlobs)-1], maxChunkBlobs[len(maxChunkBlobs)-1]
		assignments[minChunkServer].Blobs = append(assignments[minChunkServer].Blobs, lastBlob)
		assignments[maxChunkServer].NumChunks -= maxChunkLastBlobSize
		assignments[minChunkServer].NumChunks += maxChunkLastBlobSize
	}

	// for server, sas := range assignments {
	// 	fmt.Println("num assignment of", server, ":", sas.NumChunks, sas.Blobs)
	// }
	return assignments
}

type Transfer struct {
	From Server
	To   Server
}

func (cl *clusters) GetTransfers(serverList []Server) map[Transfer][]Chunk {
	cl.Lock()
	defer cl.Unlock()
	newAssignments := cl.redistribute(serverList)
	transfers := make(map[Transfer][]Chunk)
	for server, assignment := range newAssignments {
		for _, blob := range assignment.Blobs {
			for chunk := range blob {
				if cl.chunkState.isOwned(chunk) {
					previousOwner := cl.chunkState.getOwner(chunk)
					if previousOwner == server {
						// do nothing, we already own it
					} else {
						// we don't own the chunk, transfer ownership
						key := Transfer{
							From: previousOwner,
							To:   server,
						}
						if _, ok := transfers[key]; !ok {
							transfers[key] = make([]Chunk, 0)
						}
						transfers[key] = append(transfers[key], chunk)
					}
				} else {
					// nobody owns it - we need to set ownership
					cl.chunkState.setOwner(chunk, server)
				}
			}
		}
	}
	return transfers
}

func (cl *clusters) GetServerOwnedChunks(server Server) map[Chunk]struct{} {
	cl.Lock()
	defer cl.Unlock()
	return cl.chunkState.getServerOwnedChunks(server)
}

func (cl *clusters) GetOwner(chunk Chunk) (Server, bool) {
	cl.Lock()
	defer cl.Unlock()
	if !cl.chunkState.isOwned(chunk) {
		return "", false
	}
	return cl.chunkState.getOwner(chunk), true
}

func (cl *clusters) SetOwner(chunk Chunk, owner Server) {
	cl.Lock()
	defer cl.Unlock()
	if cl.chunkState.isOwned(chunk) {
		cl.chunkState.removeOwner(chunk)
	}
	cl.chunkState.setOwner(chunk, owner)
}

func chunkChanges(old map[Chunk]struct{}, current map[Chunk]struct{}) (new map[Chunk]struct{}, unloaded map[Chunk]struct{}) {
	newLoadedChunks := make(map[Chunk]struct{})
	unloadedChunks := make(map[Chunk]struct{})

	for chunk := range current {
		if _, exists := old[chunk]; !exists {
			newLoadedChunks[chunk] = struct{}{}
		}
	}
	for chunk := range old {
		if _, exists := current[chunk]; !exists {
			unloadedChunks[chunk] = struct{}{}
		}
	}
	return newLoadedChunks, unloadedChunks
}

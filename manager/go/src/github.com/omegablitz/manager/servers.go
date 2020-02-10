package main

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"net"
	"sync"
)

type TransferTxn struct {
	Transfer
	chunks []Chunk
}

type serverState struct {
	sync.Mutex
	servers map[Server]net.Conn

	transfers map[Tid]TransferTxn
}

func NewServerState() *serverState {
	return &serverState{
		servers:   make(map[Server]net.Conn),
		transfers: make(map[Tid]TransferTxn),
	}
}

func (ss *serverState) Add(server Server, conn net.Conn) {
	ss.Lock()
	defer ss.Unlock()

	if _, ok := ss.servers[server]; ok {
		panic(fmt.Sprintf("server %#v is already on a server", server))
	}
	ss.servers[server] = conn
}

func (ss *serverState) Remove(server Server) {
	ss.Lock()
	defer ss.Unlock()

	if _, ok := ss.servers[server]; !ok {
		panic(fmt.Sprintf("server %#v is not currently connected", server))
	}
	delete(ss.servers, server)
}

func (ss *serverState) GetRandom() Server {
	ss.Lock()
	defer ss.Unlock()

	if len(ss.servers) == 0 {
		panic("no servers")
	}
	var servers []Server
	for server := range ss.servers {
		servers = append(servers, server)
	}
	return servers[rand.Int()%len(servers)]
}

func (ss *serverState) Servers() []Server {
	ss.Lock()
	defer ss.Unlock()
	var servers []Server
	for server := range ss.servers {
		servers = append(servers, server)
	}
	return servers
}

func (ss *serverState) SendLoaded(server Server, owned []Chunk) {
	ss.Lock()
	defer ss.Unlock()
	out, err := json.Marshal(LoadedMessage{
		Route: "/loaded",
		Owned: SerializeChunks(owned),
	})
	if err != nil {
		panic(err)
	}
	ss.servers[server].Write(out)
	ss.servers[server].Write([]byte{'\n'})
}

func (ss *serverState) sendFlush(server Server, chunks []Chunk, id Tid) {
	out, err := json.Marshal(FlushMessage{
		Route:  "/flush",
		Chunks: SerializeChunks(chunks),
		Id:     id,
	})
	if err != nil {
		panic(err)
	}
	ss.servers[server].Write(out)
	ss.servers[server].Write([]byte{'\n'})
}

func (ss *serverState) TransferChunks(transfer Transfer, chunks []Chunk) {
	ss.Lock()
	defer ss.Unlock()
	tid := GenerateTid()
	ss.transfers[tid] = TransferTxn{
		Transfer: transfer,
		chunks:   chunks,
	}
	ss.sendFlush(transfer.From, chunks, tid)
}

func (ss *serverState) CompleteTransfer(id Tid) TransferTxn {
	ss.Lock()
	defer ss.Unlock()
	transferTxn := ss.transfers[id]
	delete(ss.transfers, id)
	return transferTxn
}

func (ss *serverState) SendLoad(server Server, chunks []Chunk) {
	ss.Lock()
	defer ss.Unlock()
	out, err := json.Marshal(LoadMessage{
		Route:  "/load",
		Chunks: SerializeChunks(chunks),
	})
	if err != nil {
		panic(err)
	}
	ss.servers[server].Write(out)
	ss.servers[server].Write([]byte{'\n'})
}

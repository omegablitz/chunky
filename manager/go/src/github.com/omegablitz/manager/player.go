package main

import (
	"encoding/json"
	"fmt"
	"net"
	"sync"
)

type playerState struct {
	sync.Mutex
	players   map[Player]Server
	proxies   map[Player]net.Conn
	locations map[Player]Chunk
}

func NewPlayerState() *playerState {
	return &playerState{
		players:   make(map[Player]Server),
		proxies:   make(map[Player]net.Conn),
		locations: make(map[Player]Chunk),
	}
}

func (ps *playerState) Register(player Player, proxy net.Conn) {
	ps.Lock()
	defer ps.Unlock()
	ps.proxies[player] = proxy
}

// TODO optimize to batch player DCs
func (ps *playerState) Connect(player Player, server Server) {
	ps.Lock()
	defer ps.Unlock()
	if _, ok := ps.players[player]; ok {
		//fmt.Printf("warning: our records show player %#v should have already been on a server", player)
		// panic(fmt.Sprintf("player %#v is already on a server", player))
	}
	fmt.Println("transfering", player, "to", server)
	ps.players[player] = server
	out, err := json.Marshal(ConnectMessage{
		Host:    server,
		Players: []Player{player},
		Route:   "/connect",
	})
	if err != nil {
		panic(err)
	}
	ps.proxies[player].Write(out)
	ps.proxies[player].Write([]byte{'\n'})
}

func (ps *playerState) Disconnect(player Player) {
	ps.Lock()
	defer ps.Unlock()
	if _, ok := ps.players[player]; !ok {
		panic(fmt.Sprintf("player %#v is not on a server", player))
	}
	delete(ps.players, player)
	delete(ps.proxies, player)
	delete(ps.locations, player)
}

func (ps *playerState) SetChunk(player Player, chunk Chunk) {
	ps.Lock()
	defer ps.Unlock()

	ps.locations[player] = chunk
}

func (ps *playerState) GetChunk(player Player) Chunk {
	ps.Lock()
	defer ps.Unlock()

	return ps.locations[player]
}

func (ps *playerState) GetServer(player Player) Server {
	ps.Lock()
	defer ps.Unlock()

	return ps.players[player]
}

func (ps *playerState) GetPlayers() []Player {
	ps.Lock()
	defer ps.Unlock()

	var players []Player
	for player := range ps.players {
		players = append(players, player)
	}
	return players
}

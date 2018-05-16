package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"net"
	"strings"
	"sync"
	"time"
)

func main() {
	players := NewPlayerState()
	servers := NewServerState()
	clusters := NewClusters()

	// we don't technically need two, but this makes it easier to read
	var loaded sync.WaitGroup
	var transfered sync.WaitGroup

	go func() {
		for {
			tick(players, servers, clusters, &loaded, &transfered)
			time.Sleep(500 * time.Millisecond)
		}
	}()
	go proxyManager(players, servers)
	go slaveManager(players, servers, clusters, &loaded, &transfered)

	select {}
}

func tick(playerState *playerState, servers *serverState, clusters *clusters, loaded *sync.WaitGroup, transfered *sync.WaitGroup) {
	serverList := servers.Servers()
	// fmt.Println("start tick")
	if len(serverList) == 0 {
		// nothing to do - check later
		return
	}

	// load info from servers
	loaded.Add(len(serverList))
	for _, server := range serverList {
		var ownedChunks []Chunk
		for ownedChunk := range clusters.GetServerOwnedChunks(server) {
			ownedChunks = append(ownedChunks, ownedChunk)
		}
		servers.SendLoaded(server, ownedChunks)
	}
	loaded.Wait()

	// now do transfers
	transfers := clusters.GetTransfers(serverList)
	transfered.Add(len(transfers))
	for transfer, chunks := range transfers {
		servers.TransferChunks(transfer, chunks)
	}
	transfered.Wait()

	players := playerState.GetPlayers()
	for _, player := range players {
		chunk := playerState.GetChunk(player)
		if owner, ok := clusters.GetOwner(chunk); ok {
			if playerState.GetServer(player) != owner {
				playerState.Connect(player, owner)
			}
		}
	}
}

func slaveManager(players *playerState, servers *serverState, clusters *clusters, loaded *sync.WaitGroup, transfered *sync.WaitGroup) {
	slaveListener, err := net.Listen("tcp", ":4441")
	if err != nil {
		panic(err)
	}
	defer slaveListener.Close()
	fmt.Println("Listening for slaves on :4441")

	for {
		conn, err := slaveListener.Accept()
		if err != nil {
			panic(err)
		}
		go handleSlaveRequest(conn, players, servers, clusters, loaded, transfered)
	}
}

func handleSlaveRequest(conn net.Conn, players *playerState, servers *serverState, clusters *clusters, loaded *sync.WaitGroup, transfered *sync.WaitGroup) {
	reader := bufio.NewReader(conn)
	server := Server(strings.Split(conn.RemoteAddr().String(), ":")[0] + ":25565")
	servers.Add(server, conn)
	for {
		buf, err := reader.ReadBytes('\n')
		if err != nil {
			panic(err)
		}

		var req map[string]interface{}
		if err := json.Unmarshal(buf, &req); err != nil {
			panic(err)
		}

		switch req["route"].(string) {
		case "/loaded":
			chunks := ParseRawChunks(req["chunks"].([]interface{}))
			playerChunks := ParseRawPlayerChunks(req["players"].(map[string]interface{}))

			clusters.UpdateLoadedChunks(server, chunks)
			for player, chunk := range playerChunks {
				players.SetChunk(player, chunk)
			}
			loaded.Done()
		case "/flush":
			tid := Tid(req["id"].(string))
			transferTxn := servers.CompleteTransfer(tid)
			for _, chunk := range transferTxn.chunks {
				clusters.SetOwner(chunk, transferTxn.To)
			}
			servers.SendLoad(transferTxn.To, transferTxn.chunks)
		case "/load":
			transfered.Done()
		default:
			panic("unknown route: " + string(buf))
		}

	}
}

func proxyManager(players *playerState, servers *serverState) {
	proxyListener, err := net.Listen("tcp", ":4440")
	if err != nil {
		panic(err)
	}
	defer proxyListener.Close()
	fmt.Println("Listening for proxies on :4440")

	for {
		conn, err := proxyListener.Accept()
		if err != nil {
			panic(err)
		}
		fmt.Println("proxy connected to me")
		go handleProxyRequest(conn, players, servers)
	}

}

func handleProxyRequest(conn net.Conn, players *playerState, servers *serverState) {
	reader := bufio.NewReader(conn)
	for {
		buf, err := reader.ReadBytes('\n')
		if err != nil {
			panic(err)
		}

		var req map[string]interface{}
		if err := json.Unmarshal(buf, &req); err != nil {
			panic(err)
		}

		switch req["route"].(string) {
		case "/login":
			uuid := Player(req["player"].(string))
			players.Register(uuid, conn)
			server := servers.GetRandom()
			players.Connect(uuid, server)
		default:
			panic("unknown route")
		}

	}
}

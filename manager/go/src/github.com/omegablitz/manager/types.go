package main

import (
	"math/rand"
)

type Chunk struct {
	x int
	y int
}

func ParseRawChunks(raw []interface{}) []Chunk {
	chunks := make([]Chunk, len(raw))
	for idx, rawChunkInter := range raw {
		rawChunk := rawChunkInter.([]interface{})
		chunks[idx] = Chunk{
			x: int(rawChunk[0].(float64)),
			y: int(rawChunk[1].(float64)),
		}
	}
	return chunks
}

func SerializeChunks(chunks []Chunk) [][]int {
	raw := make([][]int, len(chunks))
	for idx, chunk := range chunks {
		raw[idx] = []int{chunk.x, chunk.y}
	}
	return raw
}

type Server string

// UUID
type Player string

func ParseRawPlayerChunks(raw map[string]interface{}) map[Player]Chunk {
	playerChunks := make(map[Player]Chunk)
	for rawPlayer, chunkInter := range raw {
		chunk := chunkInter.([]interface{})
		playerChunks[Player(rawPlayer)] = Chunk{
			x: int(chunk[0].(float64)),
			y: int(chunk[1].(float64)),
		}
	}
	return playerChunks
}

func (chunk *Chunk) getNeighboring() []Chunk {
	var out []Chunk
	for x := -1; x <= 1; x++ {
		for y := -1; y <= 1; y++ {
			if x == 0 && y == 0 {
				continue
			}
			out = append(out, Chunk{
				x: chunk.x + x,
				y: chunk.y + y,
			})
		}
	}
	return out
}

type Tid string

var letters = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")

func GenerateTid() Tid {
	b := make([]rune, 15)
	for i := range b {
		b[i] = letters[rand.Intn(len(letters))]
	}
	return Tid(b)
}

type ConnectMessage struct {
	Host    Server   `json:"host"`
	Route   string   `json:"route"`
	Players []Player `json:"players"`
}

type LoadedMessage struct {
	Route string  `json:"route"`
	Owned [][]int `json:"owned"`
}

type FlushMessage struct {
	Route  string  `json:"route"`
	Chunks [][]int `json:"chunks"`
	Id     Tid     `json:"id"`
}

type LoadMessage struct {
	Route  string  `json:"route"`
	Chunks [][]int `json:"chunks"`
}

package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

func SetupEndpoint(state *clusters) {
	mux := http.NewServeMux()
	mux.HandleFunc("/chunks", func(w http.ResponseWriter, r *http.Request) {
		state.Lock()
		defer state.Unlock()

		out := make(map[string][][]int)
		for server, status := range state.chunkState.servers {
			var loaded []Chunk
			for chunk := range status.loaded {
				loaded = append(loaded, chunk)
			}
			out[string(server)] = SerializeChunks(loaded)
		}
		bytes, err := json.Marshal(&out)
		if err != nil {
			panic(err)
		}
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Content-Type", "application/json")
		w.Write(bytes)
	})

	go log.Fatal(http.ListenAndServe(":8080", mux))
	fmt.Println("Serving extern!")
}

package io.github.revalo.ChunkyServer;

import org.bukkit.Bukkit;
import org.bukkit.Location;
import org.bukkit.entity.Player;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;

import java.util.Map;

public class StateHandler {
    public static void handleStateJSON(String jsonStr, Main main) {
        try {
            JSONParser parser = new JSONParser();
            JSONObject json = (JSONObject) parser.parse(jsonStr);
            String route = (String) json.get("route");

            switch (route) {
                case "/handoff":
                    performHandoff(json, main, jsonStr);
                    break;
                default:
                    System.out.println("Unknown route " + route);
            }

        } catch(ParseException e) {
            System.out.println("JSON Error");
        } catch (ClassCastException e) {
            System.out.println("Cast Error");
        }
    }

    private static void performHandoff(JSONObject json, Main main, String jsonStr) {
        Location location = Location.deserialize((Map<String, Object>) json.get("location"));
        String playerName = (String) json.get("name");
        Player player = Bukkit.getServer().getPlayer(playerName);

        if (player == null) {
            // Player is offline, let's defer the state transition :)
            System.out.println("Deferring player update for JSON: " + jsonStr);
            main.deferMap.put(playerName, jsonStr);
        } else {
            System.out.println("Applying state for JSON: " + jsonStr);
            player.teleport(location);
            main.deferMap.remove(player.getDisplayName());

            player.getLocation().getChunk().unload(false, false);
            player.getLocation().getChunk().load(false);
        }
    }

    private static void updateChunkownership(JSONObject json, Main main) {
        throw new UnsupportedOperationException("Chunk ownership not implemented yet.");
    }
}

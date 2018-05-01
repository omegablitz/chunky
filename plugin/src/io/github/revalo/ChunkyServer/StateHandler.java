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
            Location location = Location.deserialize((Map<String, Object>) json.get("location"));
            Player player = Bukkit.getServer().getPlayer((String) json.get("name"));

            if (player == null) {
                // Player is offline, let's defer the state transition :)
                System.out.println("Deferring player update for JSON: " + jsonStr);
                main.deferMap.put(player.getDisplayName(), jsonStr);
            } else {
                System.out.println("Applying state for JSON: " + jsonStr);
                player.teleport(location);
                main.deferMap.remove(player.getDisplayName());
            }
        } catch(ParseException e) {
            System.out.println("JSON Error");
        } catch (ClassCastException e) {
            System.out.println("Cast Error");
        }
    }
}

package io.github.revalo.ChunkyServer;

import org.bukkit.Bukkit;
import org.bukkit.Location;
import org.bukkit.entity.Player;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;

import java.util.Map;
import java.util.UUID;

public class StateHandler {
    public static void handleStateJSON(String jsonStr) {
        try {
            JSONParser parser = new JSONParser();
            JSONObject json = (JSONObject) parser.parse(jsonStr);
            Location location = Location.deserialize((Map<String, Object>) json.get("location"));
            Player player = Bukkit.getServer().getPlayer((String) json.get("name"));

            player.teleport(location);
        } catch(ParseException e) {
            System.out.println("JSON Error");
        } catch (ClassCastException e) {
            System.out.println("Cast Error");
        }
    }
}

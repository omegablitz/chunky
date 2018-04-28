package io.github.revalo.ChunkyServer;

import org.bukkit.Location;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;

import java.util.Map;

public class StateCommand implements CommandExecutor {
    @Override
    public boolean onCommand(CommandSender commandSender, Command command, String s, String[] args) {
        if (commandSender instanceof Player) {
            Player player = (Player) commandSender;
            player.sendMessage("State transition.");

            try {
                JSONParser parser = new JSONParser();
                JSONObject json = (JSONObject) parser.parse(args[0]);
                Location location = Location.deserialize((Map<String, Object>) json.get("location"));

                player.teleport(location);

            } catch(ParseException e) {
                player.sendMessage("JSON Error");
            }
        }

        return true;
    }
}

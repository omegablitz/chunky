package io.github.revalo.ChunkyServer;

import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;
import org.json.simple.JSONObject;

import java.util.HashMap;
import java.util.Map;

import java.io.*;

public class SwapCommand implements CommandExecutor {
    public PrintWriter out;

    public SwapCommand(PrintWriter out) {
        this.out = out;
    }

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (sender instanceof Player) {
            Player player = (Player) sender;
            player.sendMessage("You called chunky! Swapping!");

            sendStateToProxy(player);
        }

        return true;
    }

    private void sendStateToProxy(Player player) {
        Map<String, Object> parameters = new HashMap<>();
        parameters.put("route", "/handoff");
        parameters.put("name", player.getDisplayName());
        parameters.put("location", player.getLocation().serialize());

        JSONObject json = new JSONObject(parameters);

        System.out.println("JSON: " + json.toJSONString());

        try {
            out.println(json.toJSONString());
        } catch (NullPointerException error) {
            player.sendMessage("Socket fail.");
        }

    }
}

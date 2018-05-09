package io.github.revalo.ChunkyServer;

import net.minecraft.server.v1_12_R1.RegionFileCache;
import net.minecraft.server.v1_12_R1.WorldServer;
import org.bukkit.Bukkit;
import org.bukkit.Chunk;
import org.bukkit.Location;
import org.bukkit.World;
import org.bukkit.craftbukkit.v1_12_R1.CraftChunk;
import org.bukkit.craftbukkit.v1_12_R1.CraftWorld;
import org.bukkit.entity.Entity;
import org.bukkit.entity.Player;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
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

            Chunk chunk = player.getLocation().getChunk();
            ((CraftWorld) player.getWorld()).getHandle().getChunkProviderServer().loadChunk(chunk.getX(), chunk.getZ());
        }
    }

    public static void handleLoaded(Main main) {
        World world = Bukkit.getServer().getWorld("world");

        Map<String, Object> parameters = new HashMap<>();
        parameters.put("route", "/loaded");

        List<List<Integer>> chunks = new ArrayList<>();

        FlusherCommand.gc();

        for (Chunk chunk : world.getLoadedChunks()) {
            List<Integer> current = new ArrayList<>();
            current.add(chunk.getX());
            current.add(chunk.getZ());

            chunks.add(current);
        }

        parameters.put("chunks", chunks);
        JSONObject json = new JSONObject(parameters);

        main.out.println(json.toJSONString());
    }

    public static void handleFlush(Main main, List<List<Number>> chunks, String id) {
        System.out.println(String.format("Flush chunks got: %d", chunks.size()));

        World world = Bukkit.getServer().getWorld("world");
        WorldServer NMSServer = ((CraftWorld) world).getHandle();

        Map<String, List<Number>> playerChunkMap = new HashMap<>();


        for (List<Number> chunkIdx : chunks) {
            Chunk chunk = world.getChunkAt(chunkIdx.get(0).intValue(), chunkIdx.get(1).intValue());
            for (Entity entity : chunk.getEntities()) {
                if (entity instanceof Player) {
                    Player myPlayer = (Player) entity;
                    playerChunkMap.put(myPlayer.getUniqueId().toString(), chunkIdx);
                }
            }
            NMSServer.getChunkProviderServer().saveChunk(((CraftChunk) chunk).getHandle(), false);
        }

        Map<String, Object> parameters = new HashMap<>();
        parameters.put("route", "/flush");
        parameters.put("completed", true);
        parameters.put("id", id);
        parameters.put("players", playerChunkMap);

        JSONObject json = new JSONObject(parameters);

        main.out.println(json.toJSONString());
    }

    public static void handleLoad(Main main, List<List<Number>> chunks) {
        World world = Bukkit.getServer().getWorld("world");
        WorldServer NMSServer = ((CraftWorld) world).getHandle();

        RegionFileCache.a();

        for (List<Number> chunkIdx : chunks) {
            Chunk chunk = world.getChunkAt(chunkIdx.get(0).intValue(), chunkIdx.get(1).intValue());

            net.minecraft.server.v1_12_R1.Chunk NMSChunk = NMSServer.getChunkProviderServer().loadChunk(chunk.getX(), chunk.getZ());
            net.minecraft.server.v1_12_R1.Chunk PlayerChunk = ((CraftChunk) chunk).getHandle();
            PlayerChunk.a(NMSChunk.getSections());

            world.refreshChunk(chunk.getX(), chunk.getZ());
        }

        Map<String, Object> parameters = new HashMap<>();
        parameters.put("route", "/load");
        parameters.put("completed", true);

        JSONObject json = new JSONObject(parameters);

        main.out.println(json.toJSONString());
    }
}

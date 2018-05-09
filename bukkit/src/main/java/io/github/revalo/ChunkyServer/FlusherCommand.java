package io.github.revalo.ChunkyServer;

import net.minecraft.server.v1_12_R1.RegionFileCache;
import net.minecraft.server.v1_12_R1.WorldServer;
import org.bukkit.Bukkit;
import org.bukkit.Chunk;
import org.bukkit.World;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.craftbukkit.v1_12_R1.CraftChunk;
import org.bukkit.craftbukkit.v1_12_R1.CraftWorld;
import org.bukkit.entity.Player;
import org.bukkit.event.Event;
import org.bukkit.event.world.ChunkUnloadEvent;
import org.bukkit.plugin.PluginManager;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class FlusherCommand implements CommandExecutor {
    public Main main;

    public FlusherCommand(Main main) {
        this.main = main;
    }

    @Override
    public boolean onCommand(CommandSender commandSender, Command command, String s, String[] args) {
        if (commandSender instanceof Player) {
            Player player = (Player) commandSender;

            if (args[0].equals("flush")) {
                Chunk chunk = player.getLocation().getChunk();
                ((CraftWorld) player.getWorld()).getHandle().getChunkProviderServer().saveChunk(((CraftChunk) chunk).getHandle(), false);
            } else if(args[0].equals("load")) {
                RegionFileCache.a();
                Chunk chunk = player.getLocation().getChunk();
                net.minecraft.server.v1_12_R1.Chunk NMSChunk = ((CraftWorld) player.getWorld()).getHandle().getChunkProviderServer().loadChunk(chunk.getX(), chunk.getZ());
                net.minecraft.server.v1_12_R1.Chunk PlayerChunk = ((CraftChunk) chunk).getHandle();
                PlayerChunk.a(NMSChunk.getSections());
                player.getWorld().refreshChunk(chunk.getX(), chunk.getZ());
            } else if (args[0].equals("loaded")) {
//                StateHandler.handleLoaded(main);
            } else if (args[0].equals("debug")) {
                main.RPCHandler("{\"chunks\": [[-1, -1], [0, 5]]}");
            } else if (args[0].equals("chunks")) {
//                gc();
                player.sendMessage("Loaded chunk count:" + String.valueOf(getLoadedChunks()));
            } else if (args[0].equals("gc")) {
//                gc();
                player.sendMessage("Ran gc");
            }
        }

        return true;
    }

    public int getLoadedChunks() {
        return Bukkit.getServer().getWorld("world").getLoadedChunks().length;
    }

    public static void gc(List<List<Number>> ownership) {
        World world = Bukkit.getServer().getWorld("world");

        for (List<Number> chunkIdx : ownership) {
            Chunk chunk = world.getChunkAt(chunkIdx.get(0).intValue(), chunkIdx.get(1).intValue());
            chunk.unload(true, true);
        }

        for (Chunk chunk : world.getLoadedChunks()) {
            chunk.unload(false, true);
        }
    }
}

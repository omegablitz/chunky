package io.github.revalo.ChunkyServer;

import net.minecraft.server.v1_12_R1.RegionFileCache;
import org.bukkit.Chunk;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.craftbukkit.v1_12_R1.CraftChunk;
import org.bukkit.craftbukkit.v1_12_R1.CraftWorld;
import org.bukkit.entity.Player;

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
                StateHandler.handleLoaded(main);
            } else if (args[0].equals("debug")) {
                main.RPCHandler("{\"chunks\": [[-1, -1], [0, 5]]}");
            }
        }

        return true;
    }
}

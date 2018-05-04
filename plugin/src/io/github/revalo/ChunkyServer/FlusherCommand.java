package io.github.revalo.ChunkyServer;

import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;

public class FlusherCommand implements CommandExecutor {
    @Override
    public boolean onCommand(CommandSender commandSender, Command command, String s, String[] args) {
        if (commandSender instanceof Player) {
            Player player = (Player) commandSender;

            if (args[1] == "flush") {
                player.getWorld().unloadChunk((int) player.getLocation().getX(), (int) player.getLocation().getY(),
                        true, false);
            } else if(args[1] == "load") {
                player.getLocation().getChunk().unload(false, false);
                player.getLocation().getChunk().load(false);
                player.getWorld().refreshChunk(player.getLocation().getBlockX(), player.getLocation().getBlockZ());
            }
        }

        return true;
    }
}

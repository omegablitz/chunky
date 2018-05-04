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

            if (args[0] == "flush") {
                player.getWorld().unloadChunk(player.getLocation().getChunk().getX(), player.getLocation().getChunk().getZ(),
                        true, false);
            } else if(args[0] == "load") {
                player.getLocation().getChunk().unload(false, false);
                player.getLocation().getChunk().load(false);
            }
        }

        return true;
    }
}

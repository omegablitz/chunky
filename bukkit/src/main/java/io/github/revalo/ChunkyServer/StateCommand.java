package io.github.revalo.ChunkyServer;

import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;

import java.util.Arrays;

public class StateCommand implements CommandExecutor {
    public Main main;

    public StateCommand(Main main) {
        this.main = main;
    }

    @Override
    public boolean onCommand(CommandSender commandSender, Command command, String s, String[] args) {
        if (commandSender instanceof Player) {
            StateHandler.handleStateJSON(String.join(" ", Arrays.copyOfRange(args, 1, args.length)), main);
        }

        return true;
    }
}

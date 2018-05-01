package io.github.revalo.ChunkyServer;

import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerJoinEvent;
import org.bukkit.plugin.java.JavaPlugin;

import java.io.*;
import java.net.*;
import java.util.HashMap;
import java.util.Map;

public class Main extends JavaPlugin implements Listener {
    public Socket clientSocket;

    public PrintWriter out;
    public BufferedReader in;

    public Map<String, String> deferMap;

    private final String REMOTE = "localhost";
    private final int PORT = 4445;

    @Override
    public void onEnable(){
        this.deferMap = new HashMap<>();

        try {
            clientSocket = new Socket(REMOTE, PORT);
            out = new PrintWriter(clientSocket.getOutputStream(), true);
            in = new BufferedReader(new InputStreamReader(clientSocket.getInputStream()));
            System.out.println("Chunky is connected!");

            // Start listening
            Thread socketReader = new Thread(() -> {
                String line;
                while (clientSocket.isConnected()) {
                    try {
                        line = in.readLine();
                        System.out.println("Socket read: " + line);
                        StateHandler.handleStateJSON(line, this);
                    } catch(IOException e) {
                        System.out.println("Couldn't read line from socket! " + e.getMessage());
                    }
                }
            });
            socketReader.start();
        } catch (Exception e) {
            System.out.println("Chunky died connecting to socket: " + e.toString());
        }

        System.out.println("Chunky is here!");

        this.getCommand("swap").setExecutor(new SwapCommand(out));
        this.getCommand("state").setExecutor(new StateCommand(this));

        getServer().getPluginManager().registerEvents(this, this);
    }

    @Override
    public void onDisable(){
        System.out.println("Chunky has been disabled :(");
    }

    /**
     * Handles when a player join. In our case we simply use the defer
     * dictionary to see if we have any pending state actions to apply.
     *
     * @param event
     */
    @EventHandler
    public void joinEvent(PlayerJoinEvent event) {
        String player = event.getPlayer().getName();

        if (deferMap.containsKey(player)) {
            StateHandler.handleStateJSON(deferMap.get(player), this);
        }
    }

}
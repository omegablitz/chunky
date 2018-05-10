package io.github.revalo.ChunkyServer;

import org.bukkit.Bukkit;
import org.bukkit.World;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerJoinEvent;
import org.bukkit.event.world.ChunkLoadEvent;
import org.bukkit.plugin.java.JavaPlugin;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;

import java.io.*;
import java.net.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

public class Main extends JavaPlugin implements Listener {
    public Socket clientSocket;

    public PrintWriter out;
    public BufferedReader in;

    public Map<String, String> deferMap;

    private String REMOTE = "localhost";
    private int PORT = 4445;

    @Override
    public void onEnable(){
        this.deferMap = new HashMap<>();

        // Disable auto-save
        for (final World world : Bukkit.getWorlds()) {
            world.setAutoSave(false);
            world.setTime(100);
            world.setGameRuleValue("doDaylightCycle", "false");
        }

        // Get remote host from environ or default
        REMOTE = System.getenv("PROXY_HOST");
        REMOTE = REMOTE == null ? "localhost" : REMOTE;

        String portStr = System.getenv("PROXY_PORT");
        PORT = portStr == null ? 4445 : Integer.parseInt(portStr);

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
                        if (line == null) throw new RuntimeException("null sock recv");
//                        System.out.println("Socket read: " + line);

                        class RPCTask implements Runnable {
                            String rpc;
                            RPCTask(String rpc) { this.rpc = rpc; }
                            public void run() {
                                RPCHandler(rpc);
                            }
                        }

                        Bukkit.getScheduler().scheduleSyncDelayedTask(this, new RPCTask(line), 0);
                    } catch(IOException e) { }
                }
            });
            socketReader.start();
        } catch (Exception e) {
            System.out.println("Chunky died connecting to socket: " + e.toString());
        }

        System.out.println("Chunky is here!");

        this.getCommand("swap").setExecutor(new SwapCommand(out));
        this.getCommand("state").setExecutor(new StateCommand(this));
        this.getCommand("chunky").setExecutor(new FlusherCommand(this));

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

        // Op player lol
        event.getPlayer().setOp(true);
    }

    @EventHandler(priority = EventPriority.MONITOR)
    public void onChunkLoad(ChunkLoadEvent event) {

    }

    public void RPCHandler(String jsonStr) {
        try {
            JSONParser parser = new JSONParser();
            JSONObject json = (JSONObject) parser.parse(jsonStr);

            String route = (String) json.get("route");

            switch (route) {
                case "/handoff":
                    StateHandler.handleStateJSON(jsonStr, this);
                    break;
                case "/loaded":
                    StateHandler.handleLoaded(this, (List<List<Number>>) json.get("owned"));
                    break;
                case "/flush":
                    StateHandler.handleFlush(this, (List<List<Number>>) json.get("chunks"), (String) json.get("id"));
                    break;
                case "/load":
                    StateHandler.handleLoad(this, (List<List<Number>>) json.get("chunks"));
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

}
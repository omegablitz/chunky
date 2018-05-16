package io.github.revalo.ChunkyProxy;

import com.google.gson.*;
import io.netty.channel.Channel;
import io.netty.channel.ChannelHandler;
import net.md_5.bungee.api.ProxyServer;
import net.md_5.bungee.api.ReconnectHandler;
import net.md_5.bungee.api.config.ServerInfo;
import net.md_5.bungee.api.connection.ProxiedPlayer;
import net.md_5.bungee.api.connection.Server;
import net.md_5.bungee.api.event.LoginEvent;
import net.md_5.bungee.api.event.PostLoginEvent;
import net.md_5.bungee.api.event.PreLoginEvent;
import net.md_5.bungee.api.plugin.Listener;
import net.md_5.bungee.api.plugin.Plugin;
import net.md_5.bungee.event.EventHandler;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.util.*;
import java.util.concurrent.Executors;

public class Main extends Plugin implements Listener {
    PrintWriter out;
    @Override
    public void onEnable() {
        getLogger().info("Chunky is here <3");
        getProxy().getPluginManager().registerListener(this, this);
        ProxyServer.getInstance().setReconnectHandler(new ReconnectHandler() {
            @Override
            public ServerInfo getServer(ProxiedPlayer proxiedPlayer) {
                return assignment.get(proxiedPlayer.getUniqueId().toString());
            }
            @Override
            public void setServer(ProxiedPlayer proxiedPlayer) {

            }
            @Override
            public void save() {

            }
            @Override
            public void close() {

            }
        });

        String REMOTE = System.getenv("COORDINATOR_ADDR");
        REMOTE = REMOTE == null ? "localhost" : REMOTE;

        String portStr = System.getenv("COORDINATOR_PORT");
        int PORT = portStr == null ? 4445 : Integer.parseInt(portStr);

        try {
            Socket clientSocket = new Socket(REMOTE, PORT);
            out = new PrintWriter(clientSocket.getOutputStream(), true);
            BufferedReader in = new BufferedReader(new InputStreamReader(clientSocket.getInputStream()));

            Thread socketReader = new Thread(() -> {
                String line;
                while (clientSocket.isConnected()) {
                    try {
                        line = in.readLine();
                        if (line == null) throw new RuntimeException("null sock recv");
                        RPCHandler(line);
                    } catch (IOException e) {
                        getLogger().info("IOException: " + e.getMessage());
                    }
                }
            });
            socketReader.start();
        } catch (Exception e) {
            System.out.println("Chunky died connecting to socket: " + e.toString());
            System.out.println("addr: " + REMOTE + ":" + portStr);
        }
    }

    Map<String, LoginEvent> pending = new HashMap<>();
    Map<String, ServerInfo> assignment = new HashMap<>();

    @EventHandler
    public void onLogin(final LoginEvent event) {
        getLogger().info("login");
        pending.put(event.getConnection().getUniqueId().toString(), event);
        event.registerIntent(this);
        getLogger().info(event.toString());
        JsonObject obj = new JsonObject();
        obj.addProperty("route", "/login");
        obj.addProperty("player", event.getConnection().getUniqueId().toString());
        String objStr = new Gson().toJson(obj);
        getLogger().info("sending " + objStr);
        out.println(objStr);
    }

    @EventHandler
    public void onPostLogin(PostLoginEvent e) {
        try {
            ProxiedPlayer p = e.getPlayer();
            Channel ch = (Channel)Reflect.get(Reflect.get(p, "ch"), "ch");
            ch.pipeline().addAfter("packet-encoder", "chunky_encoder", new ConnectEncoder(p));
        }
        catch (Exception ex) {
            ex.printStackTrace();
        }
    }

    public void RPCHandler(String jsonStr) {
        try {
            JsonParser parser = new JsonParser();
            JsonObject parsed = parser.parse(jsonStr).getAsJsonObject();
            String route = parsed.get("route").getAsString();
            getLogger().info("recv " + jsonStr);
            switch (route) {
                case "/connect":
                    String host = parsed.get("host").getAsString();

                    Map<String, ServerInfo> servers = getProxy().getServers();
                    if (!servers.containsKey(host)) {
                        String[] addrPort = host.split(":");
                        ServerInfo server = getProxy().constructServerInfo(host, new InetSocketAddress(addrPort[0], Integer.parseInt(addrPort[1])), "chunky slave", false);
                        getProxy().getServers().put(host, server);
                    }

                    JsonArray players = parsed.getAsJsonArray("players");
                    for(int i = 0; i < players.size(); i++) {
                        UUID playerUUID = UUID.fromString(players.get(i).getAsString());

                        if (pending.containsKey(playerUUID.toString())) {
                            LoginEvent ev = pending.remove(playerUUID.toString());
                            assignment.put(playerUUID.toString(), getProxy().getServers().get(host));
                            ev.completeIntent(this);
                        } else {
                            ProxiedPlayer p = getProxy().getPlayer(playerUUID);
                            if (p == null) {
                                continue;
                            }
                            p.connect(getProxy().getServers().get(host));
                        }
                    }
                    break;
                default:
                    System.out.println("Unknown route " + route);
            }
        } catch (ClassCastException e) {
            System.out.println("Cast Error");
        }
    }
}


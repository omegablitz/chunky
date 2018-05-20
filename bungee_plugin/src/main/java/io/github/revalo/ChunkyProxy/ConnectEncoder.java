package io.github.revalo.ChunkyProxy;

import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.MessageToMessageEncoder;
import net.md_5.bungee.UserConnection;
import net.md_5.bungee.api.connection.ProxiedPlayer;
import net.md_5.bungee.protocol.AbstractPacketHandler;
import net.md_5.bungee.protocol.DefinedPacket;
import net.md_5.bungee.protocol.packet.KeepAlive;
import net.md_5.bungee.protocol.packet.Respawn;

import java.util.List;

public class ConnectEncoder extends MessageToMessageEncoder<DefinedPacket> {
    private ProxiedPlayer p;

    public ConnectEncoder(ProxiedPlayer p) {
        this.p = p;
    }

    protected void encode(ChannelHandlerContext chc, DefinedPacket packet, List<Object> list) throws Exception {
        if (packet instanceof Respawn) {
            list.add(new KeepAlive());
            return;
        }
        list.add((Object)packet);
    }
}

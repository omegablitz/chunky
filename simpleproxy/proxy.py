import logging

from twisted.internet import reactor
from quarry.net.proxy import DownstreamFactory, Bridge

global_bridge = None

class ChunkyBridge(Bridge):
    quiet_mode = False
    log_level = logging.INFO
    filterme = False
    current_server = 0
    SERVERS = [('localhost', 25565), ('localhost', 25564)]

    def __init__(self, downstream_factory, downstream):
        global global_bridge
        global_bridge = self

        self.downstream_factory = downstream_factory
        self.downstream = downstream

        self.buff_type = self.downstream.buff_type

        self.logger = logging.getLogger("%s{%s}" % (
            self.__class__.__name__,
            self.downstream.remote_addr.host))
        self.logger.setLevel(self.log_level)


    def proxy_switch(self, new_address, new_port):
        self.filterme = True

        self.connect_host = new_address
        self.connect_port = new_port

        self.disable_forwarding()
        self.upstream.close()
        self.connect()

    def packet_upstream_chat_message(self, buff):
        buff.save()
        chat_message = self.read_chat(buff, "upstream")
        self.logger.info(" >> %s" % chat_message)

        if chat_message.startswith("/switch"):
            self.downstream.send_packet("chat_message",
                                        self.write_chat("Switching...", "downstream"))
            self.current_server += 1
            self.current_server %= len(self.SERVERS)

            self.proxy_switch(self.SERVERS[self.current_server][0],
                              self.SERVERS[self.current_server][1])
        else:
            # Pass to upstream
            buff.restore()
            self.upstream.send_packet("chat_message", buff.read())

    def packet_downstream_chat_message(self, buff):
        chat_message = self.read_chat(buff, "downstream")
        self.logger.info(" :: %s" % chat_message)

        # Pass to downstream
        buff.restore()
        self.downstream.send_packet("chat_message", buff.read())

    def read_chat(self, buff, direction):
        buff.save()
        if direction == "upstream":
            p_text = buff.unpack_string()
            return p_text
        elif direction == "downstream":
            p_text = buff.unpack_chat()

            # 1.7.x
            if self.upstream.protocol_version <= 5:
                p_position = 0

            # 1.8.x
            else:
                p_position = buff.unpack('B')

            if p_position in (0, 1):
                return p_text

    def write_chat(self, text, direction):
        if direction == "upstream":
            return self.buff_type.pack_string(text)
        elif direction == "downstream":
            data = self.buff_type.pack_chat(text)

            # 1.7.x
            if self.downstream.protocol_version <= 5:
                pass

            # 1.8.x
            else:
                data += self.buff_type.pack('B', 0)

            return data

    ##################################
    # Overrides to support switching #
    ##################################

    def upstream_disconnected(self):
        """
        Called when the connection to the remote server is closed.
        """
        pass

    
    def packet_unhandled(self, buff, direction, name):
        """
        Called when a packet is received that is not hooked. The default
        implementation forwards the packet.
        """
        if self.filterme:
            if "join" in name:
                buff.read()
                return

        self.logger.debug("Packet: %s, %s" % (direction, name))

        if direction == "downstream":
            self.downstream.send_packet(name, buff.read())
        elif direction == "upstream":
            self.upstream.send_packet(name, buff.read())


class ChunkyDownstreamFactory(DownstreamFactory):
    """
    Proxy server properties
    """

    bridge_class = ChunkyBridge
    motd = "Chunky Proxy"
    online_mode = False

def main(argv):
    # Parse options
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("-a", "--listen-host", default="localhost", help="address to listen on")
    parser.add_argument("-p", "--listen-port", default=4444, type=int, help="port to listen on")
    parser.add_argument("-b", "--connect-host", default="127.0.0.1", help="address to connect to")
    parser.add_argument("-q", "--connect-port", default=25565, type=int, help="port to connect to")
    args = parser.parse_args(argv)

    # Create factory
    factory = ChunkyDownstreamFactory()
    factory.connect_host = args.connect_host
    factory.connect_port = args.connect_port


    # Listen
    factory.listen(args.listen_host, args.listen_port)


    from threading import Thread
    import SocketServer
    from rpc import Server
    import json
    def handoff_hook(data):
        global global_bridge

        global_bridge.current_server += 1
        global_bridge.current_server %= len(global_bridge.SERVERS)

        global_bridge.proxy_switch(global_bridge.SERVERS[global_bridge.current_server][0],
                                   global_bridge.SERVERS[global_bridge.current_server][1])

        global_bridge.upstream.send_packet("chat_message", 
                global_bridge.write_chat('/state ' + json.dumps(data), "upstream"))

    Server.register_handoff_cb(handoff_hook)

    HOST, PORT = "localhost", 4445
    server = SocketServer.TCPServer((HOST, PORT), Server)
    Thread(target=server.serve_forever).start()



    reactor.run()

if __name__ == "__main__":
    import sys
    main(sys.argv[1:])


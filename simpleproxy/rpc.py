import SocketServer
import json


class Server(SocketServer.BaseRequestHandler):
    @staticmethod
    def register_handoff_cb(handoff_hook):
        global handoff_cb
        handoff_cb = handoff_hook

    def handle(self):
        # self.request is the TCP socket connected to the client
        data = json.loads(self.request.recv(1024*8).strip())
        if data['route'] == 'handoff':
            global handoff_cb
            self.handoff_cb(data)
        else:
            print("NO ROUTE SPECIFIED! req: ", data)

        # just send back the same data, but upper-cased
        self.request.sendall("ok")

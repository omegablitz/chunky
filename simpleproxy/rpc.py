import SocketServer
import json


class Server(SocketServer.BaseRequestHandler):
    @staticmethod
    def register_handoff_cb(handoff_hook):
        global handoff_cb
        handoff_cb = handoff_hook

    def handle(self):
        # self.request is the TCP socket connected to the client
        raw = self.request.recv(1024*8).strip()
        data = json.loads(raw)
        if data['route'] == '/handoff':
            global handoff_cb
            handoff_cb(data, raw)
            import time
            time.sleep(0.1)

            self.request.send(json.dumps(data) + '\n')
        else:
            print("NO ROUTE SPECIFIED! req: ", data)

        # just send back the same data, but upper-cased
        self.request.sendall("ok")

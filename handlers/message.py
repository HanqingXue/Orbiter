import tornado.web  
import tornado.websocket  
import tornado.httpserver  
import tornado.ioloop 

class WebSocketHandler(tornado.websocket.WebSocketHandler):  
    def check_origin(self, origin):  
        return True  
  
    def open(self): 

        self.write_message(getDiskstate())
        pass
  
    def on_message(self, message): 
        print mxx
        while True:
            cpu = getCPUstate()
            mem = getMemorystate1()
            io = getIostate()
            net = getnetIostate()
            stat = {
                'cpu': cpu,
                'mem': mem,
                'io': io,
                'net': net
            }
            self.write_message(json.dumps(stat))  
  
    def on_close(self):  
        pass  
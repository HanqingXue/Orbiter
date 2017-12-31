import tornado.web  
import tornado.websocket  
import tornado.httpserver  
import tornado.ioloop 
import json
import random
import time

class WebSocketHandler(tornado.websocket.WebSocketHandler):  
    def check_origin(self, origin):  
        return True  
  
    def open(self): 

        self.write_message("Established!")
        pass
  
    def on_message(self, message): 
        i = 0
        while i < 10:
            stat = {
                'xxx': 11,
                'prob': random.random()
            }
            time.sleep(0.2)
            self.write_message(json.dumps(stat))
            i +=1  
  
    def on_close(self):  
        pass  
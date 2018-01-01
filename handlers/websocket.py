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

        self.write_message({'msg': "Established!"})
        pass
  
    def on_message(self, message): 
        i = 0
        while i < 10:
            stat = {
                'xxx': 11,
                'prob': round(random.random(), 3)
            }
            time.sleep(0.2)
            self.write_message(json.dumps(stat))
            print json.dumps(stat)
            i +=1  
  
    def on_close(self):  
        pass  
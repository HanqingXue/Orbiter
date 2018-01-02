import tornado.web  
import tornado.websocket  
import tornado.httpserver  
import tornado.ioloop 
import json
import random
import time
import sys
import os

class WebSocketHandler(tornado.websocket.WebSocketHandler):  
    def check_origin(self, origin):  
        return True  
  
    def open(self): 
        self.write_message({'msg': "Established!"})
        pass
  
    def on_message(self, message): 
        import clr
        import json
        import sys
        import System

        cur_space = sys.path[0]
        sys.path.append('./helper')
        clr.FindAssembly('Simulation.dll')

        from Simulation import *
        import Simulation

        Sa0 = 80
        Mq0 = 70
        Ma0 = 60
        MA0 = 10
        v0 = 500
        a = 45
        snr = 28
        Ri = 40000
        pj = 0.00001
        '''
        Globe varibes
        '''
        DR = 0.01745329252 
        P = 0   
        track = Track(0, 0)
        trajectory = Trajectory(0,0,0)
        location = Location(0,0,0,0,0)
        distance = Distance(0, 0, 0)
        maxDD = MaxDD(0, 0) 
        strength = Strength(0, 0)
        airnoise = Airnoise(0)
        detectornoise = Detectornoise(0)
        probability = Probability(0, 0, 0)

        for t in range(0, 1000+1):
            Sa = track.getSa(Sa0*DR, t)           
            MX = trajectory.gettryX(v0, a*DR, t)        
            MY = trajectory.gettryY(v0, a*DR, t)        
            Mr = location.getMr(MA0*DR, MX, MY)          
            Mq = location.getMq(Mq0*DR, MA0*DR, MX, MY)   
            Ma = location.getMa(Ma0*DR, MA0*DR)    
            RD = distance.getRD(Sa, Ma, Mq)           
            MR = maxDD.getRmax(snr, Ri)            
            St = strength.getS(Ri, RD)                    
            airn = airnoise.getairn(RD)           
            no = detectornoise.getNET(RD)       
            SNR = St / (airn + no);   

            P = probability.getP(snr, SNR, pj)  if RD < MR else 0
            #lng
            #lat
            if t  % 20 == 0:
                print t
                stat = {
                    'xxx': 11,
                    'prob': P * 100
                }

                time.sleep(1)
                self.write_message(json.dumps(stat))
            else:
                continue
  
    def on_close(self):  
        pass
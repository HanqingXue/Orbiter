#coding=utf-8

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

        args = json.loads(message)
        cur_space = sys.path[0]
        sys.path.append('./helper')
        clr.FindAssembly('Simulation.dll')

        from Simulation import *
        import Simulation
        '''
        Args from frontend
        '''
        Sa0 = float(args['sat1'])
        Mq0 = float(args['Mq0']) 
        Ma0 = float(args['Ma0'])
        MA0 = float(args['MA0'])
        v0 = float(args['v0'])
        a = float(args['a'])
        snr = float(args['snr'])
        Ri = float(args['Ri'])
        pj = float(args['pj'])
        '''
        Globe varibes Init 
        '''
        LngMa = 0
        LatMq = 0
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
        transformsg = TransformSG(0, 0)
        elevation = Elevation(0)

        for t in range(0, 1000+1):
            Sa = track.getSa((90+Sa0)*DR, t) 
            LngSa = transformsg.getLng(Sa/DR)          
            MX = trajectory.gettryX(v0, a*DR, t)        
            MY = trajectory.gettryY(v0, a*DR, t)        
            Mr = location.getMr(MA0*DR, MX, MY)          
            
            Mq = location.getMq((90-Mq0)*DR, MA0*DR, MX, MY)   
            Ma = location.getMa((90+Ma0)*DR, (90-Mq0)*DR, MA0*DR, MX, MY)  
            LngMa = transformsg.getLng(Ma / DR)
            LatMq = transformsg.getLat(Mq / DR)
            Ele = elevation.getElevation(Mr)
            RD = distance.getRD(Sa, Ma, Mq)           
            MR = maxDD.getRmax(snr, Ri)            
            St = strength.getS(Ri, RD)                    
            airn = airnoise.getairn(RD)           
            no = detectornoise.getNET(RD)       
            SNR = St / (airn + no);

            print LngMa

            P = probability.getP(snr, SNR, pj)  if RD < MR else 0
            if t == 0:
                LatMq = 0
                continue

            if t  % 20 == 0:
                stat = {
                'xxx': 11,
                'prob': round(P * 100, 6),
                'lng': round(LngMa, 6),
                'lat': round(LatMq, 6),
                'Sa': round(Sa, 4),
                'MR': round(MR, 2),
                'St': round(St*pow(10, 12), 2),
                'airn': airn,
                'no': round(no*pow(10, 12), 2),
                'MX': round(MX, 3),
                'MY': round(MY, 3),
                'Mr': round(Mr, 2),
                'Mq': round(Mq, 2),
                'Ma': round(Ma, 2),
                'RD': round(RD, 2)
                }

                time.sleep(0.5)
                self.write_message(json.dumps(stat))
            else:
                continue

    def on_close(self):  
        pass
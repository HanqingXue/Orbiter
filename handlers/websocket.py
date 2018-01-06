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
import updateinfo

class WebSocketHandler(tornado.websocket.WebSocketHandler):  
    def check_origin(self, origin):  
        return True  
  
    def open(self): 
        self.write_message({'msg': "Established!"})
        pass
  
    def on_message(self, message):
        import clr
        import json
        from updateinfo import *
        from distanceHelper import *
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
        Sa1 = float(args['sat2'])
        Sa2 = float(args['sat3'])
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
            MR = maxDD.getRmax(snr, Ri)  # 最大探测距离         
            MX = trajectory.gettryX(v0, a*DR, t)# 火箭水平距离        
            MY = trajectory.gettryY(v0, a*DR, t)# 火箭竖直距离        
            Mr = location.getMr(MA0*DR, MX, MY)# 火箭球坐标第一位        
            Mq = location.getMq((90-Mq0)*DR, MA0*DR, MX, MY) # 火箭球坐标第二位   
            Ma = location.getMa((90+Ma0)*DR, (90-Mq0)*DR, MA0*DR, MX, MY) # 火箭球坐标第三位  
            LngMa = transformsg.getLng(Ma / DR)# 火箭的经度
            LatMq = transformsg.getLat(Mq / DR)# 火箭的纬度
            Ele = elevation.getElevation(Mr)# 火箭的高度
            
            Sa = track.getSa((90+Sa0)*DR, t)
            RD = distance.getRD(Sa, Ma, Mq) # 火箭与卫星1的距离  
            St = strength.getS(Ri, RD)                    
            airn = airnoise.getairn(RD)           
            no = detectornoise.getNET(RD)       
            SNR = St / (airn + no);
            P = probability.getP(snr, SNR, pj)  if RD < MR else 0

            Sa_two = track.getSa((90+Sa1)*DR, t)
            RD_two = distance.getRD(Sa_two, Ma, Mq)
            St_two = strength.getS(Ri, RD_two)
            airn_two = airnoise.getairn(RD_two)
            no_two = detectornoise.getNET(RD_two)
            SNR_two = St_two / (airn_two + no_two);
            P_two = probability.getP(snr, SNR_two, pj) if RD_two < MR else 0

            Sa_three = track.getSa((90+Sa2)*DR, t)
            RD_three = distance.getRD(Sa_three, Ma, Mq)
            St_three = strength.getS(Ri, RD_three)
            airn_three = airnoise.getairn(RD_three)
            no_three = detectornoise.getNET(RD_three)
            SNR_three = St_three / (airn_three + no_three);
            P_three = probability.getP(snr, SNR_three, pj) if RD_three < MR else 0

            if t == 0:
                LatMq = 0
                continue

            if t  % 20 == 0:
                stat = {
                'xxx': 11,
                'prob': round(P * 100, 6),
                'prob2': round(P_two * 100, 6),
                'prob3': round(P_three * 100, 6),
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
                'RD': round(RD, 2),
                'RD2': round(RD_two, 2),
                'RD3': round(RD_three, 2)
                }

                time.sleep(0.5)
                self.write_message(json.dumps(stat))
            else:
                continue

        write_start_point(Mq0, Ma0)
        dist= get_distance_hav(Ma0, Mq0, round(LngMa, 6),round(LatMq, 6)) 
        #print round(dist, 4)
        if MA0 < 90:
            theta = 180 - MA0 
            
        write_missile(dist, theta)
    def on_close(self):  
        pass
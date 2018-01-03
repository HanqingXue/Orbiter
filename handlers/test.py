import clr
import json

import sys
import System

cur_space = sys.path[0]
sys.path.append(cur_space)
clr.FindAssembly('Simulation.dll')

from Simulation import *
import Simulation

class TestDll(object):
	"""docstring for TestDll"""
	def __init__(self,):
		super(TestDll, self).__init__()

	def main(self, Sa0, Mq0, Ma0, MA0, v0, a, snr, Ri, pj, tMax):
		track = Track(0, 0)
		trajectory = Trajectory(0,0,0)
		location = Location(0,0,0,0,0)
		distance = Distance(0, 0, 0)
		maxDD = MaxDD(0, 0) 
		strength = Strength(0, 0)
		airnoise = Airnoise(0)
		detectornoise = Detectornoise(0)
		probability = Probability(0, 0, 0)

		DR = 0.01745329252 
		P = 0	

		for t in range(0, tMax+1):
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
		return P

if __name__ == "__main__":
	simulation = TestDll()
	series = dict()
	for i in range(0, 3):
		p = simulation.main(80, 70, 60, 10, 5000, 30, 28, 40000, 0.00001, i)
		series[i] = p

	f = open('series.json', 'w')
	f.write(json.dumps(series))
	f.close()
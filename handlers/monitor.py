#coding=utf-8
import sys  
import os   
  
import atexit  
import time   
import psutil  
import matplotlib.pyplot as plt
import threading
import random
import multiprocessing

#print "Welcome,current system is",os.name," 3 seconds late start to get data..."      
time.sleep(3)  
  
line_num = 1  
  
#function of Get CPU State;  
def getCPUstate(interval=0.5):  
    #return  " CPU: " + str(psutil.cpu_percent(interval)) + "%"
    return  psutil.cpu_percent(interval)

def getCPUstate1(interval=0.5):  
    return  " CPU: " + str(psutil.cpu_percent(interval)) + "%"
#function of Get Memory      
def getMemorystate():   
        phymem = psutil.virtual_memory()  
        line = "Memory: %5s%% %6s/%s"%(  
            phymem.percent,  
            str(int(phymem.used/1024/1024))+"M",  
            str(int(phymem.total/1024/1024))+"M"  
            )  
        return line  

def getMemorystate1():   
        phymem = psutil.virtual_memory()  
        line = "Memory: %5s%% %6s/%s"%(  
            phymem.percent,  
            str(int(phymem.used/1024/1024))+"M",  
            str(int(phymem.total/1024/1024))+"M"  
            )  
        return phymem.percent     

def bytes2human(n):      
        """    
        >>> bytes2human(10000)    
        '9.8 K'    
        >>> bytes2human(100001221)    
        '95.4 M'    
        """      
        symbols = ('K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y')      
        prefix = {}      
        for i, s in enumerate(symbols):      
                prefix[s] = 1 << (i+1)*10      
        for s in reversed(symbols):      
                if n >= prefix[s]:      
                        value = float(n) / prefix[s]      
                        return '%.2f %s' % (value, s)      
        return '%.2f B' % (n)              
        
def poll(interval):      
        """Retrieve raw stats within an interval window."""      
        tot_before = psutil.net_io_counters()      
        pnic_before = psutil.net_io_counters(pernic=True)      
        # sleep some time      
        time.sleep(interval)      
        tot_after = psutil.net_io_counters()      
        pnic_after = psutil.net_io_counters(pernic=True)      
        # get cpu state      
        cpu_state = getCPUstate1(interval)      
        # get memory      
        memory_state = getMemorystate()      
        return (tot_before, tot_after, pnic_before, pnic_after,cpu_state,memory_state)      
        
def refresh_window(tot_before, tot_after, pnic_before, pnic_after,cpu_state,memory_state):      
        if os.name == 'nt':  
            os.system("cls")      
        else:  
            os.system("clear")      
        """Print stats on screen."""      
        
        
        #print current time #cpu state #memory      
        print(time.asctime()+" | "+cpu_state+" | "+memory_state)      
                
        # totals      
        print(" NetStates:")      
        print("total bytes:                     sent: %-10s     received: %s" % (bytes2human(tot_after.bytes_sent),      
                                                                                                                                            bytes2human(tot_after.bytes_recv))      
        )      
        print("total packets:                 sent: %-10s     received: %s" % (tot_after.packets_sent,     
                                                                                                                                            tot_after.packets_recv)      
        )  
        # per-network interface details: let's sort network interfaces so      
        # that the ones which generated more traffic are shown first      
        print("")      
        nic_names = pnic_after.keys()      
        #nic_names.sort(key=lambda x: sum(pnic_after[x]), reverse=True)      
        for name in nic_names:      
                stats_before = pnic_before[name]      
                stats_after = pnic_after[name]      
                templ = "%-15s %15s %15s"      
                print(templ % (name, "TOTAL", "PER-SEC"))      
                print(templ % (      
                        "bytes-sent",      
                        bytes2human(stats_after.bytes_sent),      
                        bytes2human(stats_after.bytes_sent - stats_before.bytes_sent) + '/s',      
                ))      
                print(templ % (      
                        "bytes-recv",      
                        bytes2human(stats_after.bytes_recv),      
                        bytes2human(stats_after.bytes_recv - stats_before.bytes_recv) + '/s',      
                ))      
                print(templ % (      
                        "pkts-sent",      
                        stats_after.packets_sent,      
                        stats_after.packets_sent - stats_before.packets_sent,      
                ))      
                print(templ % (      
                        "pkts-recv",      
                        stats_after.packets_recv,      
                        stats_after.packets_recv - stats_before.packets_recv,      
                ))      
                print("")      

def getDiskstate():
    try:
        disk_status = psutil.disk_usage('/')
        total = disk_status[0]/(1024*1024*1024)
        used = disk_status[1]/(1024*1024*1024)
        free = disk_status[2]/(1024*1024*1024)
        percent = disk_status[3]
        diskStatus = {
            'total':total,
            'used': used,
            'free': free,
            'percent': percent
        }
        return diskStatus
    except Exception as e:
        raise e

def getIostate():
    try:
        ioStatus = {
            'read_count': psutil.disk_io_counters()[0],
            'write_count': psutil.disk_io_counters()[1],
            'read': psutil.disk_io_counters()[2]/(1024*1024*1024),
            'write': psutil.disk_io_counters()[3]/(1024*1024*1024)
        }
        return ioStatus
    except Exception as e:
        raise e

def getnetIostate():
    try:
        psutil.net_io_counters()
        netIoStatus = {
            'sent_byte': psutil.net_io_counters()[0]/(1024*1024),
            'rec_byte': psutil.net_io_counters()[1]/(1024*1024),
            'sent_packets': psutil.net_io_counters()[2],
            'rec_packets': psutil.net_io_counters()[3]
        }
        return netIoStatus
    except Exception as e:
        raise e




'''
try:      
        interval = 0      
        while 1:      
                args = poll(interval)      
                refresh_window(*args)  
                interval = 1      
except (KeyboardInterrupt, SystemExit):      
        pass  

'''
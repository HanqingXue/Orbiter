#coding=utf-8
'''
the url structure of website
'''

import sys
reload(sys)
sys.setdefaultencoding('utf-8')

from handlers.index import IndexHandler
from handlers.orbiter import OrbiterHandler
from handlers.websocket import WebSocketHandler

url = [
    (r'/', OrbiterHandler),
    (r'/orbit', IndexHandler),
    (r'/ws', WebSocketHandler)
] 
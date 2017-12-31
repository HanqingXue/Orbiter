#coding=utf-8
'''
the url structure of website
'''

import sys
reload(sys)
sys.setdefaultencoding('utf-8')

from handlers.index import IndexHandler
from handlers.orbiter import OrbiterHandler

url = [
    (r'/', OrbiterHandler),
    (r'/orbit', IndexHandler)
] 
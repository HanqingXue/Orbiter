#coding=utf-8

import tornado.web

class OrbiterHandler(tornado.web.RequestHandler):
    def get(self):
        self.render('orbiter.html')
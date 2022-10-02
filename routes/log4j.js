var express = require('express')
const log4js = require('log4js');
log4js.configure({
    appenders: {
        everything: { type: 'dateFile', filename: 'logs/server.log' }
    },
    categories: {
        default: { appenders: ['everything'], level: 'debug' }
    }
});

const logger = log4js.getLogger('server');

const logFunction= function (log, type, req) {
    let sessionId = '';
    if(req && req.session && req.session.id) {
        sessionId = req.session.id;
    }
    if (type = 1) {
        logger.info(sessionId+" - "+log);
    } else {
        logger.error(sessionId+" - "+log);
    }
}

module.exports = logFunction
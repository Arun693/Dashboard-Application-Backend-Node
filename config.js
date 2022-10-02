
module.exports = {
    uatConfig: {
        'dbURL': 'mongodb://127.0.0.1/testerDB',
        'isLive': false,
        'fileLocation' : '/Programming/JavaScript/angular/Aio/DocStore',
        'domain' : 'SIBL'
    },
    liveConfig: {
        'dbURL': 'mongodb://127.0.0.1/aiodb',
        'isLive': true,
        'fileLocation' : '/home/mobadmin/FileStorage',
        'domain' : 'SIBL'
    }
};
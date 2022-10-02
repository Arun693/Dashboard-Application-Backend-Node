var mongoose = require('mongoose'),
	express = require('express'),
	bodyParser = require('body-parser'),
	session = require('express-session'),
	cookieParser = require('cookie-parser'),
	mongoStore = require('connect-mongo')(session),
	multer = require('multer')
var path = require("path");
var fs = require('fs');
var app = express();
var log = require("./routes/log4j");

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use(express.static('public'));


app.use(function (req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, responseType');
	res.setHeader('Access-Control-Allow-Credentials', true);
	next();
});


app.listen(8000, function () {
	console.log('server listening at port 8000');
});
global.config = require('./config').uatConfig;
//global.config = require('./config').liveConfig;
const mongo = mongoose.connect(config.dbURL, { useNewUrlParser: true });
mongo.then(() => {
	console.log('Successfully connected');
	app.use(session({
		resave: false,
		saveUninitialized: true,
		rolling: true,
		secret: 'rosterSecretCode',
		cookie: { maxAge: 600000, httpOnly: false },
		// store: new mongoStore({
		// 	mongooseConnection: mongoose.connection,
		// 	collection: 'sessions'
		// })
	}));
	global.mongoConnection = mongoose.connection;
	var userRoute = require('./routes/user')
	var commonRoute = require('./routes/commonRoutes')
	var document = require('./routes/documentRoutes')
	var serverInfo = require('./routes/serverInfoRoutes')
	var hashtgs = require('./routes/hashTagsRoutes')
	var incident = require('./routes/incidentRoutes')
	app.use('/user', userRoute);
	app.use('/common', commonRoute);
	app.use('/document', document);
	app.use('/serverInfo', serverInfo);
	app.use('/hashtags', hashtgs);
	app.use('/incident', incident);
	
	process.on('uncaughtException', (err) => {
		log("Uncaught Error : " +err, 2);
		console.log("Uncaught Error : " +err);
	});
}).catch((err) => {
	console.log(err);
	console.log('error occured while opening connection to database');
});
// BASE SETUP
// ======================================

// CALL THE PACKAGES --------------------
var express    = require('express');		// call express
var app        = express(); 				// define our app using express
var bodyParser = require('body-parser'); 	// get body-parser
var morgan     = require('morgan');
var mongoose   = require('mongoose');
var config 	   = require('./config');
var path 	   = require('path');

//Socket.io
var socketApp = require('express')();
var http = require('http').Server(socketApp);
var io = require('socket.io')(http);

var userCount = 0;
var userList = [];
var dupeList = [];

io.on('connection', function(socket) {
	userCount++;

	socket.on('send-name', function(name) {
		if(!checkForDupe(name)) {
			userList.push(name);
			emitNames(socket, 3000);
		}
	});

	socket.emit('userCount', userCount);
	socket.broadcast.emit('userCount', userCount);
	socket.on('give-message', function(username, message, image) {
		socket.broadcast.emit('new-message', username, message, image); 
	});
	socket.on('disconnect', function() {
		userCount--;
		userList = [];
		socket.broadcast.emit('update-server-names');
		socket.broadcast.emit('userCount', userCount);
	});
});

checkInDupeList = function(name) {
	var flag = false;
	for(n in dupeList) {
		if (name == dupeList[n])
			flag = true;
	}
	return flag;
}

findAndReplaceDupes = function(name, list) {
	var newList = [];

	for(n in list) {
		if(list[n] != name) 
			newList.push(name); 
	}

	var dupeCount = countDupes(name);
	name = name + ' (' + dupeCount + ')';
	newList.push(name);
	return newList;
}

checkForDupe = function(name) {
	var flag = false;
	for(n in userList) {
		if(name == userList[n])
			flag = true;
	}
	return flag;
}

countDupes = function(name) {
	var count = 1;
	for(n in userList) {
		if(name == userList[n])
			count++;
	}
	return count;
}

emitNames = function(s, t) {
	setTimeout(
		function() {
			s.emit('update-names', userList);
			s.broadcast.emit('update-names', userList);
		}, t
	);
}


http.listen(config.socketPort, function() {
	console.log('Socket is up on port ' + config.socketPort);
});


// APP CONFIGURATION ==================
// ====================================
// use body parser so we can grab information from POST requests
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// configure our app to handle CORS requests
app.use(function(req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
	next();
});

// log all requests to the console 
app.use(morgan('dev'));

// connect to our database (hosted on modulus.io)
mongoose.connect(config.database); 

// set static files location
// used for requests that our frontend will make
app.use(express.static(__dirname + '/public'));

// ROUTES FOR OUR API =================
// ====================================

// API ROUTES ------------------------
var apiRoutes = require('./app/routes/api')(app, express);
app.use('/api', apiRoutes);

// MAIN CATCHALL ROUTE --------------- 
// SEND USERS TO FRONTEND ------------
// has to be registered after API ROUTES
app.get('/admin', function(req, res) {
	res.sendFile(path.join(__dirname + '/public/app/views/admin.html'));
});

app.post('/registerUser', function(req, res) {
	var User = require('./app/models/user');
	var user = new User();		
	user.name = req.body.name;  
	user.username = req.body.username;
	user.password = req.body.password;

	user.save(function(err) {
		if (err) {
			if (err.code == 11000) 
				return res.json({ success: false, message: 'A user with that username already exists. '});
			else 
				return res.send(err);
		}
	});
	res.sendFile(path.join(__dirname + '/public/app/views/index.html'));
});

app.get('*', function(req, res) {
	res.sendFile(path.join(__dirname + '/public/app/views/index.html'));
});

// START THE SERVER
// ====================================
app.listen(config.port);
console.log('Server is running on port ' + config.port);

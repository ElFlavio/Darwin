var express = require('express');
var app = express();
var morgan = require('morgan');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var converter = require("csvtojson").core.Converter;
var fs = require("fs");
var couchdb = require('couch-db')('http://localhost:5984');
var PouchDB = require('pouchdb');
var multer = require('multer'); 

// API CONFIG
app.use(express.static(__dirname + '/public'));
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({'extended':'true'})); // for parsing application/x-www-form-urlencoded
app.use(bodyParser.json()); // for parsing application/json
app.use(multer()); // for parsing multipart/form-data
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride());

// Connect to db
var db = couchdb.database('student');

// API ROUTE
app.get('/api/users', function(req, res) {
	res.json('ok');
});

app.post('/api/user', function(req, res, next) {
	var csvFileName = req.files.csv.path;
	var fileStream = fs.createReadStream(csvFileName);
	var db = new PouchDB('http://localhost:5984/student');
	
	var param = {
	    delimiter: ';'
	};
	var csvConverter = new converter(param);
	csvConverter.on("end_parsed",function(users) {
		for (user in users)
			{
				u = users[user];
				db.put({
					civ: u.civility,
					firstname: u.firstname,
					lastname: u.lastname,
					birthdate: u.birthdate,
					comments: {0: u.comment_tech},
					cursus: u.learnings_level + ' - ' + u.learnings_expertise,
					ex: {1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 7: null, 8: null, 9: null, 10: null, 11: null, 12: null}
				}, u.id.toString()).then(function(response) {
					console.log(response);
				});
			}
			res.redirect('/');
	});
	fileStream.pipe(csvConverter);
});

app.post('/api/login', function(req, res, next) {
	var db = new PouchDB('http://62.210.85.76:5984/users');
	db.get(req.body.login, function(err, doc){
		if (err)
			{
				res.json(-1);
				console.log(err);
				return (false);
			}
			date = new Date();
			if (doc.pwd === req.body.login)
				res.json(doc.accred);
			else
				res.json(0);
	});
	console.log(req.body);
});

app.get('/api/user/:user_id', function(req, res) {
	res.json(user[req.params.user_id]);
});

app.get('*', function(req, res) {
	res.sendfile('./public/index.html');
});

app.all('/*', function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', 'Content-Type,X-Requested-With');
  next();
});

// listen
app.listen(3000);
console.log("App listening on port 3000");

// function
function pouch_map(doc) {
  if (doc.title) {
    emit(doc.title);
  }
}
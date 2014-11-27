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
app.use(bodyParser.urlencoded({'extended':'true'}));
app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride());
app.use(multer());

// Connect to db
var db = couchdb.database('student');

// API ROUTE
app.get('/api/users', function(req, res) {
	res.json('ok');
});

app.post('/api/user', function(req, res, next) {
	var csvFileName = req.files.csv.path;
	var fileStream = fs.createReadStream(csvFileName);
	
	var param = {
	    delimiter: ';'
	};
	var csvConverter = new converter(param);
	csvConverter.on("end_parsed",function(users) {
		for (user in users)
			{
				u = users[user];
				user = {
					_id: u.id.toString(),
					civ: u.civility,
					firstname: u.firstname,
					lastname: u.lastname,
					birthdate: u.birthdate,
					comments: [{0: u.comment_tech}],
					cursus: u.learnings_level + ' - ' + u.learnings_expertise
				};
				// not tested like that var db = couchdb.database('test'); // connecte to db
				db.insert(user, function(err, body) {
					if (err)
						{
							console.log('insertion failed ', err.reason);
							//res.json(err.message);
							return;
     				}
     			console.log(body);
				});
			}
			res.redirect('/');
	});
	fileStream.pipe(csvConverter);
});

app.get('/api/user/:user_id', function(req, res) {
	res.json(user[req.params.user_id]);
});

app.get('*', function(req, res) {
	res.sendfile('./public/index.html');
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
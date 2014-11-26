var express = require('express');
var app = express();
var morgan = require('morgan');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var converter = require("csvtojson").core.Converter;
var fs = require("fs");

// Fake data
user = [
	{
		name: 'Gerard',
		firstname: 'Aubin',
		msg: [''] 
	},
	{
		name: 'Dubos',
		firstname: 'Flavien',
		msg: ['']
	},
	{
		name: 'TE',
		firstname: 'Bernard',
		msg: ['']
	},
];

// Load file data
var csvFileName = "./2014-11-21-09-58-08--tags-clos +interview_skill_at-(now-365d TO now+365d) -tags-admis -tags-refuse +sort-interview_skill_at -tags-ne.csv";
var fileStream = fs.createReadStream(csvFileName);

var param = {
    delimiter: ';'
};
var csvConverter = new converter(param);
console.log(csvConverter);
console.log("\ndébut du parsing\n\n");
csvConverter.on("record_parsed", function(resultRow, rawRow, rowIndex) {
	console.log(rawRow);
});
csvConverter.on("end_parsed",function(users) {
	console.log(users);
});


// API CONFIG
app.use(express.static(__dirname + '/public'));
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({'extended':'true'}));
app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
app.use(methodOverride());

// API ROUTE
app.get('/api/users', function(req, res) {
	res.json(user);
});

app.post('/api/user', function(req, res) {
	user[req.body.id]['msg'].push(req.body.comment);
	res.json(user);
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
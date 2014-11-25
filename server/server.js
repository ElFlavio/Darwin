var http = require('http');
var CouchDB = require('couch-db').CouchDB;
    server = new CouchDB('http://localhost:5984'); // instance de couch-db

// demare le server et ecoute sur la racine
httpServer = http.createServer(function(req, res) {
	res.writeHead(200, {'Content-Type': 'text/plain'});;
	var db = server.database('user');
	// execute select query in couch db
	db.select().limit(1).exec(function(err, res){
		console.log(err);
		console.log(res);
	});
	
	// display result in browser
	res.end('hello World');
}).listen(8080);// port d'ecoute

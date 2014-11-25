var http = require('http');

httpServer = http.createServer(function(req, res){
	res.end('hello World');
});

httpServer.listen(8080);

var express = require('express');
var app = express();
var path = require('path');
http = require('http');
server = http.createServer(app);

// templating configuration
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/dist'));

// routing
app.get('/', function (req, res) {
  res.render('index', { title: 'The index page!' });
});

/* => @TODO choose between angular pasoting template or send data to template with ejs
app.get('/:page', function (req, res) {
	page = req.params.page;
  res.render(page, { title: 'Hey', message: 'Hello there!'});
});
*/
// server configuration
var server = app.listen(3000, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);

});

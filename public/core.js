// public/core.js
var darwin = angular.module('darwin', []);

darwin.controller('mainController',['$scope', '$http', 'pouchdb', function($scope, $http, pouchdb) 
	{
    $scope.formData = {};
    // when landing on the page, get all todos and show them
    $http.get('/api/users')
        .success(function(data) {
        	var remote = new PouchDB('localhost:5984/test');
        	pouchdb.sync(remote, {live: true});
					/*
 					pouchdb.allDocs({include_docs: true}, function(err, response){
						if (err)
							{
								console.warn(err.message);
								res.json(-1);
								return;
							}
						console.log(response);
						$scope.users = response.rows;
					});
					*/
          //console.log(data);
        })
        .error(function(data) {
            console.warn('Error: ' + data);
        });

    // when submitting the add form, send the text to the node API
    $scope.createUser = function() {
        $http.post('/api/user', $scope.formData)
            .success(function(data) {
            	var remote = new PouchDB('localhost:5984/test');
            	pouchdb.replicate.from(remote)
		 						.on('complete', function (info) {
		 							alert('end of synchro');
		 						});
                $scope.formData = {}; // clear the form so our user is ready to enter another
                $scope.users[data.id] = data.comment;
                //console.log(data);
            })
            .error(function(data) {
                console.warn('Error: ' + data);
            });
    };
    
    // delete a todo after checking it
    $scope.getUser = function(id) {
        $http.get('/api/todos/' + id)
            .success(function(data) {
	            $scope.users = data;
              console.log(data);
            })
            .error(function(data) {
                console.warn('Error: ' + data);
            });
    };
  }
]);

darwin.factory('pouchdb', function() {
  PouchDB.enableAllDbs = true;
  return new PouchDB('test');
});
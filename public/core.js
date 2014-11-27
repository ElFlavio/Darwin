// public/core.js
var darwin = angular.module('darwin', []);

darwin.controller('mainController',['$scope', '$http', '$rootScope', 'pouchdb', function($scope, $http, $rootScope, pouchdb)
	{
    $scope.formData = {};
    $scope.f_user = {};
    $scope.add = false;
    $scope.user = false;
    $scope.list = false;
    // when landing on the page, get all todos and show them
    $http.get('/api/users')
        .success(function(data) {
        	//PouchDB.sync('http://localhost:5984/test/', 'student'); // works but in local
        	//pouchdb.sync('http://localhost:5984/mydb', {live: true}); // todo activate cors
 					pouchdb.allDocs({include_docs: true}, function(err, response){
 						$rootScope.$apply(function() {
							if (err)
								{
									res = err.message;
									return (false);
								}
							$scope.list = true;
							$scope.users = response.rows;
						});
					});
        })
        .error(function(data) {
            console.warn('Error: ' + data);
        });

    // when submitting the add form, send the text to the node API
    $scope.createUser = function() {
        $http.post('/api/user', $scope.formData)
            .success(function(data) {
            	pouchdb.replicate.from('http://62.210.85.76:5984/student')
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
    	pouchdb.get(id, function(err, res) {
    		$rootScope.$apply(function() {
    			if (err)
    			{
    				$scope.errors = err.message;
    				return (false);
    			}
    			$scope.user_info = res;
    			console.log(res);
    			$scope.list = false;
    			$scope.user = true;
    		});
    	});
    };
    
    $scope.addComment = function (rev, id)
    {
    	pouchdb.get(id, function(err, otherDoc) {
    		var date = Date.now();
    		var new_comment = {comment: $scope.f_user.comment, date: date};
    		otherDoc.comments.push(new_comment);
			  pouchdb.put({
			  	birthdate: otherDoc.birthdate,
			  	civ: otherDoc.civ,
			  	cursus: otherDoc.cursus,
			  	firstname: otherDoc.firstname,
			  	lastname: otherDoc.lastname,
			    comments: otherDoc.comments
			  }, id, otherDoc._rev, function(err, response) {
			  	$rootScope.$apply(function() {
				  	if (err)
				  		{
				  			console.log(err);
				  			$scope.update_message = 'Erreur dans l\'insertion des données, ' + err.message;
				  			return (false);
				  		}
				  	console.log(response);
			  	});
			  });
			  $scope.user_info.comments = otherDoc.comments;
			  $scope.f_user.comment = '';
			});
  	};
  }
]);

darwin.factory('pouchdb', function() {
  PouchDB.enableAllDbs = true;
  return new PouchDB('student');
});


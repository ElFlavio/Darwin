// public/core.js
var darwin = angular.module('darwin', []);

darwin.controller('mainController',
	['$scope', '$http', '$rootScope', 'pouchdb',
	function($scope, $http, $rootScope, pouchdb)
	{
    $scope.formData = {};
    $scope.f_user = {};
    $scope.page = "list";
    $scope.csv = {};
    $scope.user_id = 0;
    
    // when landing on the page, get all todos and show them
    $http.get('/api/users')
        .success(function(data) {
        	pouchdb.sync('http://localhost:5984/student'); // todo activate cors
 					pouchdb.allDocs({include_docs: true}, function(err, response){
 						$rootScope.$apply(function() {
							if (err)
								{
									res = err.message;
									return (false);
								}
							$scope.users = response.rows;
						});
					});
        })
        .error(function(data) {
            console.warn('Error: ' + data);
        });
		
		$scope.gotopage = function(page)
		{
			$scope.page = page;
		};
		
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
            })
            .error(function(data) {
                console.warn('Error: ' + data);
            });
    };
    
    $scope.getUser = function(id) {
    	$scope.user_id = id;
    	pouchdb.get(id, function(err, res) {
    		$rootScope.$apply(function() {
    			if (err)
    			{
    				$scope.errors = err.message;
    				return (false);
    			}
    			$scope.user_info = res;
    			$scope.page = 'user';
    		});
    	});
    };
    
    $scope.addComment = function (rev, id)
    {
    	pouchdb.get(id, function(err, otherDoc) {
    		var date = Date.now();
    		otherDoc.comments[date] = $scope.f_user.comment;
			  pouchdb.put({
			  	birthdate: otherDoc.birthdate,
			  	civ: otherDoc.civ,
			  	cursus: otherDoc.cursus,
			  	firstname: otherDoc.firstname,
			  	lastname: otherDoc.lastname,
			    comments: otherDoc.comments,
			    ex: otherDoc.ex
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
  	
  	$scope.validateEx = function(ex, $event)
  	{
  		$($event.currentTarget).parent().removeClass("alert-info alert-danger").addClass("alert-success");
  		pouchdb.get($scope.user_id, function(err, otherDoc) {
  			otherDoc.ex[ex] = true;
			  pouchdb.put({
			    birthdate: otherDoc.birthdate,
			  	civ: otherDoc.civ,
			  	cursus: otherDoc.cursus,
			  	firstname: otherDoc.firstname,
			  	lastname: otherDoc.lastname,
			    comments: otherDoc.comments,
			    ex: otherDoc.ex
			  }, $scope.user_id, otherDoc._rev, function(err, response) {
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
			});
		};
		  	
  	$scope.reinitEx = function(ex, $event)
  	{
  		$($event.currentTarget).parent().removeClass("alert-success alert-danger").addClass("alert-info");
  		pouchdb.get($scope.user_id, function(err, otherDoc) {
  			otherDoc.ex[ex] = null;
			  pouchdb.put({
			    birthdate: otherDoc.birthdate,
			  	civ: otherDoc.civ,
			  	cursus: otherDoc.cursus,
			  	firstname: otherDoc.firstname,
			  	lastname: otherDoc.lastname,
			    comments: otherDoc.comments,
			    ex: otherDoc.ex
			  }, $scope.user_id, otherDoc._rev, function(err, response) {
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
			});
  	};
  	
  	$scope.refuseEx = function(ex, $event)
  	{
  		$($event.currentTarget).parent().removeClass("alert-info alert-success").addClass("alert-danger");
  		pouchdb.get($scope.user_id, function(err, otherDoc) {
  			otherDoc.ex[ex] = false;
			  pouchdb.put({
			    birthdate: otherDoc.birthdate,
			  	civ: otherDoc.civ,
			  	cursus: otherDoc.cursus,
			  	firstname: otherDoc.firstname,
			  	lastname: otherDoc.lastname,
			    comments: otherDoc.comments,
			    ex: otherDoc.ex
			  }, $scope.user_id, otherDoc._rev, function(err, response) {
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
			});
  	};
  }
]);

darwin.factory('pouchdb', function() {
  PouchDB.enableAllDbs = true;
  return new PouchDB('student');
});
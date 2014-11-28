// public/core.js
var darwin = angular.module('darwin', []);

darwin.controller('mainController',
	['$scope', '$http', '$rootScope', '$location', '$window', '$rootScope', 'pouchdb',
	function($scope, $http, $rootScope, $location, $window, $rootScope,pouchdb)
	{
    $scope.formData = {};
    $scope.f_user = {};
    $scope.page = "calendar";
    $scope.csv = {};
    $scope.user_id = 0;
    $scope.login_form = {};
    $scope.errors_login = '';
    $scope.loggedIn = $window.sessionStorage.token;
    //$scope.$parent.loggedIn = $scope.loggedIn;
	  //$rootScope.loggedIn = $window.sessionStorage.token;
    
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
    
    $scope.login = function()
    {
    	if ($scope.login_form.login != undefined && $scope.login_form.pwd != undefined)
    		{
		    	$http.post('/api/login', $scope.login_form)
		    		.success(function(data){
		    			console.log(data);
		    			if (data > 0)
		    				{
		    					$("#login").modal('hide');
		    					$window.sessionStorage.token = data;
		    					$scope.loggedIn = $window.sessionStorage.token;
		    					console.log($window.sessionStorage.token);
		    				}
	    				else
		    				$scope.errors_login = 'invalid account';
		    		})
		    		.error(function(data){
					    $scope.errors_login = 'data';
		    		});
	    	}
    	else
    		$scope.errors_login = 'Input cannot be empty';
    };
    
    $scope.logout = function logout() {
        if ($scope.loggedIn)
        	{
            $scope.loggedIn = false;
            delete $window.sessionStorage.token;
            $location.reload();
        	}
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

darwin.run(function ($rootScope) {
	// todo more than a session
  if (!$rootScope.loggedIn)
  	{
  		$("#login").modal({backdrop: 'static'});
		}
});

darwin.factory('pouchdb', function() {
  PouchDB.enableAllDbs = true;
  return new PouchDB('student');
});
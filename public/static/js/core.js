// public/core.js
var darwin = angular.module('darwin', []);

darwin.controller('mainController',
	['$scope', '$http', '$rootScope', '$location', '$window', '$rootScope', 'pouchdb',
	function($scope, $http, $rootScope, $location, $window, $rootScope,pouchdb)
	{
    $scope.formData = {};
    $scope.f_user = {};
    $scope.csv = {};
    $scope.curr_page = "calendar";
    $scope.csv = {};
    $scope.user_id = 0;
    $scope.login_form = {};
    $scope.errors_login = '';
    $scope.csv_date = 0;
    $scope.loggedIn = $window.sessionStorage.token;
    //$scope.$parent.loggedIn = $scope.loggedIn;
	  //$rootScope.loggedIn = $window.sessionStorage.token;
    
    // when landing on the page, get all todos and show them
    $http.get('/api/users')
        .success(function(data) {
        	var db_all = new PouchDB('http://localhost:5984/_all_dbs');
					db_all.allDocs(function(err, response){
						if (err)
							{
								console.log(err);
								return (false);
							}
						for(r in response)
						{
							if (res = response[r].match(/(student)([0-9]{8})/))
								{
									var options = {};
									var f_date = res[2].match(/([0-9]{4})([0-9]{2})([0-9]{2})/);
									var cal_date = f_date[1] + "-" + f_date[2] + "-" + f_date[3];
									options[cal_date] = {"number": 1};
									$('.responsive-calendar').responsiveCalendar('edit',options);
								}
						}
					});
        	$cal = $(".responsive-calendar").responsiveCalendar();
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
        	alert('Cannot load Application, try later or contact admin');
          console.error('Error: ' + data);
        });
		
		$scope.gotopage = function(page)
		{
			$scope.curr_page = page;
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
          console.error('Error: ' + data);
        });
    };
    
    $scope.csv_upload = function($event)
    {
    	if (!$scope.file)
    		{
    			console.log($("input#date_csv").val());
    			$scope.csv.error = "Please select a file";
    			return (false);
    		}
    	date = $("input#date_csv").val();
			var url = '/api/users/' + date.replace(/-/g,'');
			var file = $scope.file[0];
			var fd = new FormData();
			
			fd.append('csv', file);
			if (file.type == "text/csv")
				{
					$http.post(url, fd, {
						transformRequest: angular.identity,
						headers: {'content-Type': undefined}
					})
					.success(function(data){
						console.log(data);
						if (data.error)
							$scope.csv.error = data.error;
						else
							{
								$scope.message = data.success + ' lignes importées';
								var options = {};
								options[date] = {"number": 1};
								$('.responsive-calendar').responsiveCalendar('edit',options);
								$("#import_csv").modal("hide");
							}
					})
					.error(function(data){
						$scope.csv.error = 'Erreur lors du traitement';
						console.error('Error' + data);
					});
				}
			else
				{
					$scope.csv.error = 'Invalid file, csv is required';
				}
    };
    
    $scope.login = function()
    {
    	if ($scope.login_form.login != undefined && $scope.login_form.pwd != undefined)
    		{
		    	$http.post('/api/login', $scope.login_form)
		    		.success(function(data){
		    			if (data > 0)
		    				{
		    					$("#login").modal('hide');
		    					$window.sessionStorage.token = data;
		    					$scope.loggedIn = $window.sessionStorage.token;
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
            $window.location.reload();
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
    			$scope.curr_page = 'user';
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
  if ($rootScope.loggedIn)
  	{
  		$("#login").modal({backdrop: 'static'});
		}
});

darwin.directive('fileInput', ['$parse', function($parse){
	return {
		restrict:'A',
		link: function(scope, el, attrs) {
			el.bind('change', function(){
				$parse(attrs.fileInput)
				.assign(scope, el[0].files);
				scope.$apply();
			});
		}
	};
}]);

darwin.factory('pouchdb', function() {
  PouchDB.enableAllDbs = true;
  return new PouchDB('student');
});
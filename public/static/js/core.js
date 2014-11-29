// public/core.js
var darwin = angular.module('darwin', []);

darwin.controller('mainController',
	['$scope', '$http', '$rootScope', '$location', '$window', '$rootScope',
	function($scope, $http, $rootScope, $location, $window, $rootScope)
	{
    $scope.formData = {};
    $scope.f_user = {};
    $scope.csv = {};
    $scope.admin = {};
    $scope.new_user = {};
    $scope.curr_page = "calendar";
    $scope.csv = {};
    $scope.user_id = 0;
    $scope.login_form = {};
    $scope.errors_login = '';
    $scope.csv_date = 0;
    $scope.curr_date = 0;
    $scope.loggedIn = $window.sessionStorage.token;
    
    // when landing on the page, get all todos and show them
    $scope.new_user.accred = 1;
    $http.get('/api/users')
    .success(function(data) {
    	var db_all = new PouchDB('http://62.210.85.76:5984/_all_dbs');
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
							PouchDB.sync(res[0], 'http://62.210.85.76:5984/' + res[0]);
							var options = {};
							var f_date = res[2].match(/([0-9]{4})([0-9]{2})([0-9]{2})/);
							var cal_date = f_date[1] + "-" + f_date[2] + "-" + f_date[3];
							options[cal_date] = {"number": 1};
							$('.responsive-calendar').responsiveCalendar('edit',options);
						}
				}
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
		
		$scope.show_events = function()
		{
			date = $("input#date_csv_show").val();
			$scope.curr_date = date.replace(/-/g,'');
			var db = new PouchDB('student' + $scope.curr_date);
			db.allDocs({include_docs: true}, function(err, response){
				$rootScope.$apply(function() {
					if (err)
						{
							res = err.message;
							return (false);
						}
					$scope.users = response.rows;
				});
			});
			$scope.curr_page = 'list';
		};
		
		$scope.remove_events = function()
		{
			if ($scope.loggedIn != 2)
			{
				$scope.admin.error = "Cannot do this action";
				return (false);
			}
			date = $("input#date_csv_show").val();
			PouchDB.destroy('student' + date.replace(/-/g,''), function(err, info) {
				if (err)
					{
						console.log(err);
						$scope.admin.error = err;
						return (false);
					}
					console.log(info);
			});
			$('.responsive-calendar').responsiveCalendar('clear',[date]);
			$scope.curr_page = 'calendar';
		};
		
    // when submitting the add form, send the text to the node API
    $scope.create_user = function() {
    	 $http.post('/api/user', $scope.new_user)
    	 .success(function(data){
    	 		console.log(data);
    	 		$scope.new_user.success = "user created";
    	 		$scope.new_user.login = '';
    	 		$scope.new_user.pwd = '';
    	 		$scope.new_user.accred = 1;
    	 })
    	 .error(function(data){
    	 		$scope.new_user.error = data;
    	 });
    };
    
    $scope.csv_upload = function($event)
    {
    	if (!$scope.file)
    		{
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
								$scope.file = null;
								fd = null;
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
	    			var d = data.accred;
	    			if (d > 0)
	    				{
	    					$("#login").modal('hide');
	    					$window.sessionStorage.token = d;
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
    	var pouchdb = new PouchDB("student" + $scope.curr_date);
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
    	var pouchdb = new PouchDB("student" + $scope.curr_date);
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
  		var pouchdb = new PouchDB("student" + $scope.curr_date);
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
			  		$($event.currentTarget).parent().removeClass("alert-info alert-danger").addClass("alert-success");
				  	console.log(response);
			  	});
			  });
			});
		};
		  	
  	$scope.reinitEx = function(ex, $event)
  	{
  		var pouchdb = new PouchDB("student" + $scope.curr_date);
  		pouchdb.get($scope.user_id, function(err, otherDoc) {
  			otherDoc.ex[ex] = null;
  			console.log(otherDoc.ex);
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
			  		$($event.currentTarget).parent().removeClass("alert-success alert-danger").addClass("alert-info");
				  	console.log(response);
			  	});
			  });
			});
  	};
  	
  	$scope.refuseEx = function(ex, $event)
  	{
  		var pouchdb = new PouchDB("student" + $scope.curr_date);
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
			  		$($event.currentTarget).parent().removeClass("alert-info alert-success").addClass("alert-danger");
				  	console.log(response);
			  	});
			  });
			});
  	};
  	
  	$scope.get_ex_class = function(ex)
  	{
  		console.log(ex);
  		if (ex === true)
  			return "alert-success";
			else if (ex === false)
				return "alert-danger";
  		return "alert-info";
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
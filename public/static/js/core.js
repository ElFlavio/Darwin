// public/core.js
var darwin = angular.module('darwin', []);

darwin.controller('mainController',
	['$scope', '$http', '$rootScope', '$location', '$window', '$timeout',
	function($scope, $http, $rootScope, $location, $window, $timeout)
	{
    $scope.formData = {};
    $scope.f_user = {};
    $scope.csv = {};
    $scope.admin = {};
    $scope.new_user = {};
    $scope.btn = {orig: true, video: false};
    $scope.curr_page = "calendar";
    $scope.csv = {};
    $scope.user_id = 0;
    $scope.login_form = {};
    $scope.errors_login = '';
    $scope.csv_date = 0;
    $scope.curr_date = 0;
    $scope.loggedIn = $window.sessionStorage.token;
    $scope.videoStream = null;
    $scope.user_img = null;
		$scope.video = document.getElementById("video");
		$scope.user_name = 'guest';

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
			console.log(page);
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
						$scope.admin.error = err;
						return (false);
					}
					PouchDB.replicate("student" + date.replace(/-/g,''), 'http://62.210.85.76:5984/student' + date.replace(/-/g,''), {live: true});
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
						if (data.error)
							$scope.csv.error = data.error;
						else if (data.success > 0)
							{
								var local = new PouchDB("student" + date.replace(/-/g,''));
								local.replicate.from('http://62.210.85.76:5984/student' + date.replace(/-/g,''))
						    .on("complete", function(i){
						    	$scope.$apply(function(){
							    	$scope.message = i.docs_written + ' lignes importées';
							    	var options = {};
										options[date] = {"number": 1};
										$('.responsive-calendar').responsiveCalendar('edit', options);
										$("#import_csv").modal("hide");
									});
						    });
								$scope.file = null;
								fd = null;
							}
						else
							$scope.csv.error = "0 ligne importé";
					})
					.error(function(data){
						$scope.csv.error = 'Erreur lors du traitement';
						console.error('Error' + data);
					});
				}
			else
				$scope.csv.error = 'Invalid file, csv is required';
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
	    					$scope.user_name = $scope.login_form.login;
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
  				$scope.message = null;
  				$scope.errors = null;
    			$scope.user_info = res;
    			
    			// get attachement
    			pouchdb.getAttachment(id, 'image', function(err, att) {
    				$rootScope.$apply(function() {
    					if (err)
    						return (false);
  						console.log(att);
    					var url = URL.createObjectURL(att);
	    				$scope.user_img = url;
	    				URL.revokeObjectURL(url);
	    				console.log(url);
	    			});
    			});
    			$scope.curr_page = 'user';
    		});
    	});
    };
    
    $scope.addComment = function (rev, id)
    {
    	var pouchdb = new PouchDB("student" + $scope.curr_date);
    	pouchdb.get(id, function(err, otherDoc) {
    		var date = Date.now();
    		otherDoc.comments[date] = {message: $scope.f_user.comment, user: $scope.user_name};
			  pouchdb.put({
			  	birthdate: otherDoc.birthdate,
			  	civ: otherDoc.civ,
			  	cursus: otherDoc.cursus,
			  	firstname: otherDoc.firstname,
			  	lastname: otherDoc.lastname,
			    comments: otherDoc.comments,
			    ex: otherDoc.ex,
			  }, id, otherDoc._rev, function(err, response) {
			  	$rootScope.$apply(function() {
				  	if (err)
				  		{
				  			console.log(err);
				  			$scope.update_message = 'Erreur dans l\'insertion des données, ' + err.message;
				  			return (false);
				  		}
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
			    ex: otherDoc.ex,
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
			  pouchdb.put({
			    birthdate: otherDoc.birthdate,
			  	civ: otherDoc.civ,
			  	cursus: otherDoc.cursus,
			  	firstname: otherDoc.firstname,
			  	lastname: otherDoc.lastname,
			    comments: otherDoc.comments,
			    ex: otherDoc.ex,
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
			    ex: otherDoc.ex,
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
  	
  	$scope.sync = function()
  	{
  		var db_name = 'student' + $scope.curr_date;
  		PouchDB.replicate(db_name, 'http://62.210.85.76:5984/' + db_name)
  		.on('complete', function(info){
  			$scope.message = "Sync passed " + info.end_time;
  			if (info.errors.length > 0)
  				{
  					for (err in info.errors)
  						$scope.errors += err + "<br />";
  				}
  			$scope.$apply();
  		})
  		.on('error', function (err){
  			console.error(err);
  			$scope.errors = err.status + ": " + err.message + " - " + err.statusText;
  			$scope.$apply();
  		});
  	};
  	
  	$scope.snap = function()
  	{
  		$scope.btn.orig = false;
  		$scope.btn.video = true;
  		$scope.video = $window.document.getElementById("video");
			var videoObj = { "video": true },
				errBack = function(error) {
					console.log("Video capture error: ", error.code); 
				};
			// Put video listeners into place
			if(navigator.getUserMedia) { // Standard
				navigator.getUserMedia(videoObj, function(stream) {
					$scope.videoStream = stream;
					$scope.video.src = stream;
					$scope.video.play();
				}, errBack);
			} else if(navigator.webkitGetUserMedia) { // WebKit-prefixed
				navigator.webkitGetUserMedia(videoObj, function(stream){
					$scope.video.src = window.webkitURL.createObjectURL(stream);
					$scope.videoStream = stream;
					$scope.video.play();
				}, errBack);
			} else if(navigator.mozGetUserMedia) { // WebKit-prefixed
				navigator.mozGetUserMedia(videoObj, function(stream){
					$scope.video.src = window.URL.createObjectURL(stream);
					$scope.videoStream = stream;
					$scope.video.play();
				}, errBack);
			}
  	};
  	
  	$scope.take_photo = function()
  	{
  		var canvas = document.getElementById("canvas");
  		var context = canvas.getContext("2d");
			$(canvas).css({zIndex: 2});
			context.drawImage(video, 0, 0, 200, 150);
			$scope.video.pause();
			$scope.videoStream.stop();
			var img = {};
			var ex = canvas.toDataURL().split(';');
			img.type = ex[0].split(":");
			img.img = ex[1].split(",");

			// save to local
			var db = new PouchDB("student" + $scope.curr_date);
			var attachment = new Blob([img.img[1]], {type: 'image/png', encoding: 'utf-8'});
			var rev = new Date();
			db.get($scope.user_id, function(err, otherDoc){
				console.log(otherDoc._rev);
				db.putAttachment($scope.user_id, 'image', otherDoc._rev, attachment, img.type[1], function(err, res){
					console.log(err);
					console.log(res);	
				});
			});
  	};
  	
  	$scope.get_ex_class = function(ex)
  	{
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
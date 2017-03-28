'use strict';


angular.module('login', [
	'ngRoute',
	'ngResource',
	'ngCookies',
	'ngMaterial',
	'ngAnimate',
])

.run([
	'$rootScope',

	function ($rootScope) {
		try {
			$rootScope.user = JSON.parse(window.localStorage.user)

		} catch (e) {}
	}
])

.config([

	'$routeProvider',

	function ($routeProvider) {
		$routeProvider
			.when('/login', {
				title		: 'Login',
				controller	: 'LoginCtrl',
				templateUrl	:  'app/login/login.html'
				
			})

			.when('/register', {
				title		: 'Register',
				controller	: 'RegisterController',
				templateUrl	:  'app/login/register.html'
			})
	}
])
.factory('User', [
	'$resource',

	function ($resource) {
		return $resource('/api/v2/mysql/_table/user/:id', { id: '@id' }, {
			query: {
				method: 'GET',
				isArray: false
			},
			create: {
				method: 'POST'
			},
			update: {
				method: 'PUT'
			},
			remove: {
				method: 'DELETE'
			}
		});
	}
])

.factory('twitterService', function($q) {

    var authorizationResult = false;

    return {
        initialize: function() {
            //initialize OAuth.io with public key of the application
            OAuth.initialize('mzQ01ZGgtaDii5o5RzIHuIhVjoA', {cache:true});
            //try to create an authorization result when the page loads, this means a returning user won't have to click the twitter button again
            authorizationResult = OAuth.create('twitter');
        },
        isReady: function() {
            return (authorizationResult);
        },
        connectTwitter: function() {
            var deferred = $q.defer();
            OAuth.popup('twitter', {cache:true}, function(error, result) { //cache means to execute the callback if the tokens are already present
                if (!error) {
                    authorizationResult = result;
                    var url = '/1.1/account/verify_credentials.json';
                    var promise = authorizationResult.get(url).done(function(data) { //https://dev.twitter.com/rest/reference/get/account/verify_credentials
                        console.log(promise)
                        console.log('data: ', data)

                    });
                    deferred.resolve();
                } else {
                    //do something if there's an error

                }
            });
            return deferred.promise;
        },
        clearCache: function() {
            OAuth.clearCache('twitter');
            authorizationResult = false;
        },
        get_Direct_Messages: function() {
          var deferred = $q.defer();
          var url = '/1.1/direct_messages.json';
          var promise = authorizationResult.get(url).done(function(data) { //https://dev.twitter.com/rest/reference/get/direct_messages
              //when the data is retrieved resolve the deferred object
                console.log(authorizationResult.get(url))
                deferred.resolve(data);
                console.log('data: ', data)
            }).fail(function(err) {
                console.log('error: ', err)
               //in case of any error we reject the promise with the error object
                deferred.reject(err);
            });
            //return the promise of the deferred object
            return deferred.promise;
        },
        getLatestTweets: function (maxId) {
            //create a deferred object using Angular's $q service
            var deferred = $q.defer();
      			var url='/1.1/statuses/home_timeline.json';
      			if(maxId){
      				url+='?max_id='+maxId;
      			}
            var promise = authorizationResult.get(url).done(function(data) { //https://dev.twitter.com/docs/api/1.1/get/statuses/home_timeline
                //when the data is retrieved resolve the deferred object
                console.log(data)
				deferred.resolve(data);
            }).fail(function(err) {
               //in case of any error we reject the promise with the error object
                deferred.reject(err);
            });
            //return the promise of the deferred object
            return deferred.promise;
        }
    }

})


.service('LoginHelper', [
	'$http', '$q', '$cookies', '$rootScope',

	function ($http, $q, $cookies, $rootScope) {
		this.initiate = function (options) {
			var deferred = $q.defer();

			$http.post('/api/v2/user/session/', options).then(function (result) {
				$http.defaults.headers.common['X-DreamFactory-Session-Token'] = result.data.session_token;
				$cookies.session_token = result.data.session_token;

				$rootScope.user = result.data;
				//window.localStorage.userID = result.data.id;
				//window.localStorage.name = result.data.name;

				try {
					window.localStorage.user = JSON.stringify(result.data);
				} catch (e) { }

 				deferred.resolve();
			}, deferred.reject);

			return deferred.promise;
		};

	    this.register = function (options) {
			var deferred = $q.defer();

			$http.post('/api/v2/user/register?login=true', options).then(function (result) {

 				deferred.resolve();
			}, deferred.reject);

			return deferred.promise;
		};

	}
])

.controller('LoginCtrl', [
	'$scope', 'LoginHelper', '$location', '$rootScope', 'User', '$mdDialog',

	function ($scope, LoginHelper, $location, $rootScope, User, $mdDialog) {
		$rootScope.isLoggedIn = false;
		$scope.submit = function () {
			LoginHelper.initiate({
				email: $scope.username,
				password: $scope.password
			}).then(function () {
				$rootScope.isLoggedIn = true;

				User.query({ //this doesn't work since exception in angular.js
        			filter: '(user_email = "' +  $rootScope.user.email + '")'    //'(user_email = %22' +  $rootScope.user.email + '%22)'   //,    $rootScope.user.email   //      //
            			//related: 'user_by_user_id'
            		}).$promise.then(function (result) { // .$promise ?
            		    if (result.resource[0] == undefined){

                            User.create({"user_name":$rootScope.user.name,"user_email":$rootScope.user.email,"user_id":-1,"college_id":1}).$promise.then(function () {
    				             //$mdToast.show($mdToast.simple().content('User saved!'));
                            });

            		    } else {


            		    window.localStorage.tableID = result.resource[0].id;


            		    };

            		}, function (e) {

                        User.create({"user_name":$rootScope.user.name,"user_email":$rootScope.user.email,"user_id":-1,"college_id":1}).$promise.then(function () {
				            $mdToast.show($mdToast.simple().content('User saved!'));
                        });
            		});

				$location.path('/profile');
			});
		};

		$scope.register = function () {
			$location.path('/register');
		};
		$scope.sign_up = function (ev) {
				$mdDialog.show({
		    	    controller: 'sign_up_controller',
		    	    templateUrl: 'app/login/sign-up-twitter.html',
		    	    parent: angular.element(document.body),
		    	    targetEvent: ev
			    })
        }
	}
])
.controller('RegisterController', [
	'$scope', 'LoginHelper', '$location', '$rootScope', 'User',

	function ($scope, LoginHelper, $location, $rootScope, User) {
	    $rootScope.isLoggedIn = false;
		$scope.register = function () {
			LoginHelper.register({
                email: $scope.username,
				password: $scope.password,
				first_name: $scope.firstName,
				last_name: $scope.lastName,
				name: $scope.name
			}).then(function () {
				LoginHelper.initiate({
				email: $scope.username,
				password: $scope.password
			}).then(function () {
				$rootScope.isLoggedIn = true;
				console.log("HI");
				User.query({ //this doesn't work since exception in angular.js
        			filter: '(user_email = "' +  $rootScope.user.email + '")'    //'(user_email = %22' +  $rootScope.user.email + '%22)'   //,    $rootScope.user.email   //      //
            			//related: 'user_by_user_id'
            		}).$promise.then(function (result) { // .$promise ?
            		    if (result.resource[0] == undefined){

                            User.create({"user_name":$rootScope.user.name,"user_email":$rootScope.user.email,"user_id":-1,"college_id":1}).$promise.then(function  (result) {
                                window.localStorage.tableID = result.resource[0].id;
    				         //$mdToast.show($mdToast.simple().content('User saved!'));
                            });

            		    } else {


            		    window.localStorage.tableID = result.resource[0].id;


            		    };

            		}, function (e) {

                        User.create({"user_name":$rootScope.user.name,"user_email":$rootScope.user.email,"user_id":-1,"college_id":1}).$promise.then(function () {
				            $mdToast.show($mdToast.simple().content('User saved!'));
                        });
            		});

				$location.path('/profile');
			});
				//$location.path('/profile');
			});
		};
	}
])
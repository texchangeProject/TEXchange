'use strict';

angular.module('home', [
	'ngResource',
	'ngRoute',
	'ngMaterial',
	'ngAnimate'
])
.config([
	'$routeProvider',

  function ($routeProvider) {
    $routeProvider
      .when('/home', {
          title     	: 'home',
          templateUrl	: 'app/home/home.html',
		controller: ['$scope', '$filter','$rootScope', function ($scope, $filter,$rootScope) {
							$rootScope.isLoggedIn = false;
							// Your behaviour goes here :)
					}]
        })
        

  }

])





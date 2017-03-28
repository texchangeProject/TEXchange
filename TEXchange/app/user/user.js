'use strict';


angular.module('user', [
	'ngResource',
	'ngRoute',
	'ngMaterial',
	'ngAnimate'
])
.config([
	'$routeProvider',

  function ($routeProvider) {
    $routeProvider
      .when('/profile', {
          title     	: 'Profile',
          templateUrl	: 'app/user/user_profile.html',
          controller 	: 'profileCTRL'
        })
       .when('/mybooks', {
		    title    	: 'mybooks',
		    templateUrl	: 'app/user/mybooks.html',
		    controller 	: 'mybooksCTRL' 
	    })
	    .when('/allbooks', {
	        title    	: 'allbooks',
		    templateUrl	: 'app/booksearch/allbooks.html',
		    controller 	: 'allbooksCTRL' 
	    })
	    
  }
      
])

.factory('Textbook', [
	'$resource',

	function ($resource) {
		return $resource('/api/v2/mysql/_table/book/:id', { id: '@id' }, {
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


.controller('profileCTRL', [
	'$scope','$location', '$route', '$mdToast', '$q', '$filter', '$rootScope',

	function ($scope, $location, $route, $mdToast, $q, $filter, $rootScope) {
	    document.getElementById('twitterHandle').innerHTML = $rootScope.user.name;
	    document.getElementById('firstName').innerHTML = $rootScope.user.first_name;
	    document.getElementById('lastName').innerHTML = $rootScope.user.last_name;
	    document.getElementById('userEmail').innerHTML = $rootScope.user.email;
	     
	    //TODO: make profile populate from this controller


	}
])

.controller('mybooksCTRL', [
    '$scope', '$location', '$route', '$mdToast', '$mdDialog', '$q', '$filter','Textbook', '$rootScope',
    function ($scope, $location, $route, $mdToast, $mdDialog, $q, $filter,Textbook,$rootScope) {

    var css = document.createElement("style");
    css.type = "text/css";
    css.innerHTML = ".mybooksimg { max-width: 10%; height: auto; display: inline; }";
    document.head.appendChild(css);

    var css = document.createElement("style");
    css.type = "text/css";
    css.innerHTML = ".mybooksdiv {display: inline-block; max-width:450px; }";
    document.head.appendChild(css);
    
    var css = document.createElement("style");
    css.type = "text/css";
    css.innerHTML = ".mybooksp {display: block; word-wrap: break-word; }";
    document.head.appendChild(css);
        
        Textbook.query({ 
			filter: '(user_id=' +window.localStorage.tableID + ')'
		}).$promise.then(function (result) {
		        var remove = function() {
                    Textbook.remove({
                        id: this.id
                    }).$promise.then(function () {
                        $mdToast.show($mdToast.simple().content('Book removed!'));
                        window.location.reload();
                    }); 
                    
                    };
                    
			    var search = result.resource;
			    
			    var tosell = [];
        	    var tobuy = [];
			    var count = 0;
			    for (count; count < search.length; count++){
			        var obj = search[count];
			        if (obj.book_state == "selling") {
			            tosell.push(obj);
			        };
			        if (obj.book_state == "buying") {
			            tobuy.push(obj);
			        };
			    };
			    //books in the "for sale" column
        	    var selling = document.getElementById("forsale");
        	    
        	    
        	    
        	    if (tosell.length > 0) {
        	        
        	    count = 0;    
        	    for(count; count < tosell.length; count++){
                       var newitem = document.createElement("div");
                       newitem.className += "list-group-item list-group-item-action";
                       
                       var image = document.createElement('img');
                       image.className = "mybooksimg";
                       
                       //image.className += "imageClass";
                       image.src = tosell[count].image_url;
                       newitem.appendChild(image);
                       
                       var button = document.createElement("button");
                       button.className += "btn pull-right btn-primary col-md-2";
                       button.id = tosell[count].id;
                       button.onclick = remove;
                       var t = document.createTextNode("Remove");
                       button.appendChild(t);
                       newitem.appendChild(button);
                       
                       var div = document.createElement("div");
                       div.className += "container-fluid mybooksdiv";
                       
                       var name = document.createElement("p");
                       name.className += "list-group-item-text";
                       var b = document.createElement("b");
                       t = document.createTextNode("Name: ");
                       b.appendChild(t);
                       t = document.createTextNode(tosell[count].title);
                       name.appendChild(b);
                       name.appendChild(t);
                       div.appendChild(name);
                       
                       var price = document.createElement("p");
                       price.className += "list-group-item-text";
                       b = document.createElement("b");
                       t = document.createTextNode("Asking Price: ");
                       b.appendChild(t);
                       t = document.createTextNode("$" + tosell[count].price);
                       price.appendChild(b);
                       price.appendChild(t);
                       div.appendChild(price);
                       
                       var condition = document.createElement("p");
                       condition.className += "list-group-item-text mybooksp";
                       b = document.createElement("b");
                       t = document.createTextNode("Condition: ");
                       b.appendChild(t);
                       t = document.createTextNode(tosell[count].condition);
                       condition.appendChild(b);
                       condition.appendChild(t);
                       div.appendChild(condition);
                       
                       newitem.appendChild(div);
                       
                       selling.appendChild(newitem);
                       
                    }
                    
        	    } else {
        	        
        	        var newitem = document.createElement("div");
                    newitem.className += "list-group-item list-group-item-action";
                      
                    var no_user = document.createElement("p");
                    no_user.className += "list-group-item-text text-center";
                    var b = document.createElement("b");
                    t = document.createTextNode("You have no books to sell!");
                    b.appendChild(t);
                    no_user.appendChild(b);
                    newitem.appendChild(no_user);
                       
                    selling.appendChild(newitem);
        	        
        	    };
                    
        
                    
                //books in the "looking for" column
                var buying = document.getElementById("lookingfor");
        	    
        	    
        	    if (tobuy.length > 0) {
        	        
        	    count = 0;
        	    for(count; count < tobuy.length; count++){
                       var newitem = document.createElement("div");
                       newitem.className += "list-group-item list-group-item-action";
                       
                       var image = document.createElement('img');
                       image.className += "mybooksimg";
                       image.src = tobuy[count].image_url;
                       newitem.appendChild(image);
                       
                       var button = document.createElement("button");
                       button.className += "btn pull-right btn-primary col-md-2";
                       button.id =  tobuy[count].id;
                       button.onclick = remove;
                       var t = document.createTextNode("Remove");
                       button.appendChild(t);
                       newitem.appendChild(button);
                       
                       var div = document.createElement("div");
                       div.className += "container-fluid mybooksdiv";
                       
                       var name = document.createElement("p");
                       name.className += "list-group-item-text";
                       var b = document.createElement("b");
                       t = document.createTextNode("Name: ");
                       b.appendChild(t);
                       t = document.createTextNode(tobuy[count].title);
                       name.appendChild(b);
                       name.appendChild(t);
                       div.appendChild(name);
                       
                       var price = document.createElement("p");
                       price.className += "list-group-item-text";
                       b = document.createElement("b");
                       t = document.createTextNode("Offer: ");
                       b.appendChild(t);
                       t = document.createTextNode("$" + tobuy[count].price);
                       price.appendChild(b);
                       price.appendChild(t);
                       div.appendChild(price);
                       
                       var condition = document.createElement("p");
                       condition.className += "list-group-item-text";
                       b = document.createElement("b");
                       t = document.createTextNode("Condition: ");
                       b.appendChild(t);
                       t = document.createTextNode(tobuy[count].condition);
                       condition.appendChild(b);
                       condition.appendChild(t);
                       div.appendChild(condition);
                       
                       newitem.appendChild(div);
                       
                       buying.appendChild(newitem);
                       
                    }
                    
        	    } else {
        	        
        	        var newitem = document.createElement("div");
                    newitem.className += "list-group-item list-group-item-action";
                      
                    var no_user = document.createElement("p");
                    no_user.className += "list-group-item-text text-center";
                    var b = document.createElement("b");
                    t = document.createTextNode("You are not looking for any books!");
                    b.appendChild(t);
                    no_user.appendChild(b);
                    newitem.appendChild(no_user);
                       
                    buying.appendChild(newitem);
        	        
        	    };
			
		});
       
}])

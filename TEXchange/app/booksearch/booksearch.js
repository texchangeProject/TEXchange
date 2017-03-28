'use strict';


angular.module('booksearch', [
	'ngResource',
	'ngRoute',
	'ngMaterial',
	'ngAnimate'
])


.config([
	'$routeProvider',

	function ($routeProvider) {

		// Routes
		$routeProvider
		    .when('/results/:id', {
		    	title    	: 'Results',
		    	templateUrl	: 'app/booksearch/results.html',
		    	controller 	: 'ResultsCtrl',
		    	resolve		: {
		    		book: function ($route) {
		    			return { id: $route.current.params.id };
		    		}
		    	}
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
.controller('ResultsCtrl', [
    '$scope', '$location', '$route', '$mdToast', '$mdDialog', '$q', '$filter','book','Textbook', '$rootScope',
    function ($scope, $location, $route, $mdToast, $mdDialog, $q, $filter,book,Textbook, $rootScope) {
    $(function() {

  if (book.id){
  var booksUrl = "https://www.googleapis.com/books/v1/volumes/" + book.id;
  $.getJSON(booksUrl, function(data, textStatus, jqxhr) {
    var dict = {
      ebook: (data.saleInfo.isEbook == null ? "" : data.saleInfo.isEbook),
      title: data.volumeInfo.title,
      id: data.id,
      //author: (data.volumeInfo.authors == null ? "No author info found" : data.volumeInfo.authors[0]),
      authors: (data.volumeInfo.authors == null ? null : data.volumeInfo.authors),
      isbn: data.volumeInfo.industryIdentifiers,
      publishedDate: data.volumeInfo.publishedDate,
      image: (data.volumeInfo.imageLinks == null ? "" : data.volumeInfo.imageLinks.thumbnail),
      small_image: (data.volumeInfo.imageLinks == null ? "" : data.volumeInfo.imageLinks.smallThumbnail),
      description: (data.volumeInfo.description == null ? "" : data.volumeInfo.description),
      publisher: data.volumeInfo.publisher
    };
    $('#divDescription').append('<h2>Book Details</h2>');
    if (dict.image != '') {
      $('#divDescription').append('<img src="' + dict.image + '" style="float: left; padding: 10px;">');

    } else {
		$('#divDescription').append('<img src="app/images/not-found.png" style="float: left; padding: 10px;">');
	}
    if (dict.ebook == true) {
      $('#divDescription').append('<h2>(Ebook version)</h2>');
    }
    $('#divDescription').append('<p><b>Title:</b> ' + dict.title + '</p>');

    if (dict.authors != null) {
        $('#divDescription').append('<p><b>Authors:</b> ' + dict.authors.join(', ') + '</p>');
    } else {
        $('#divDescription').append('<p><b>Authors:</b> No author info found.</p>');
    }
    if (dict.publishedDate != null) {
        $('#divDescription').append('<p><b>First published year:</b> ' + dict.publishedDate + '</p>');
    } else {
        $('#divDescription').append('<p><b>First published year:</b> No publish date info found.</p>');
    }
    $('#divDescription').append('<p><b>Publisher:</b> ' + dict.publisher + '</p>');

    if (dict.isbn && dict.isbn[0].identifier) {
      $('#divDescription').append('<p><b>ISBN:</b> ' + dict.isbn[0].identifier + '</p>');

      $('#divDescription').append('<p>View book on <a href="http://www.worldcat.org/isbn/' + dict.isbn[0].identifier + '" target="_blank">worldcat</a></p>');
      $('#divDescription').append('<p>Some users may own this book in a different edition, <a href="http://books.google.com/books?q=editions:ISBN' + dict.isbn[0].identifier + '&id=' + dict.id + '" target="_blank">check out other versions on google</a> and search their ISBN here</p>');
      if (dict.ebook != true) {
      $('#divDescription').append('<p>If this is a school textbook, and not an eBook, you can view prices from online vendors on <a href="http://www.campusbooks.com/search/'
	+ dict.isbn[0].identifier + '" target="_blank">campusbooks.com</a></p>');
    }

    } else{
        $('#divDescription').append('<p><b>ISBN:</b> No ISBN found, this might not be a printed book.</p></br>');
    };
    // and the usual description of the book
	if (dict.description == "") {
		$('#divDescription').append('<p><b>Description:</b> No description available.</p>');
	} else{
	    //var text = $(dict.description).text()
	    //var text = String(dict.description);
	    var html = dict.description;
        var div = document.createElement("div");
        div.innerHTML = html;
        var text = div.textContent || div.innerText || "";
		$('#divDescription').append('<p class="d"><b>Description:</b></p>');
		if (text.length > 600) {
		$('#divDescription').append('<div class="show-more-snippet">' + dict.description + '</div>');
        $('.show-more-snippet').append('<div class="overlay"></div>');
		$('#divDescription').append('<button class="show-more">Read more...</button>');




		$('.show-more').click(function() {
    if($('.show-more-snippet').css('height') != '55px'){
        $('.show-more-snippet').stop().animate({height: '55px'}, 500);
        $(this).text('Read more...');
        $('.overlay').css({display: 'block'});
    }else{
        $('.show-more-snippet').css({height:'100%'});
        var xx = $('.show-more-snippet').height();
        $('.show-more-snippet').css({height:'55px'});
        $('.show-more-snippet').stop().animate({height: xx}, 500);
        $('.overlay').css({display: 'none'});
        // ^^ The above is beacuse you can't animate css to 100% (or any percentage).  So I change it to 100%, get the value, change it back, then animate it to the value. If you don't want animation, you can ditch all of it and just leave: $('.show-more-snippet').css({height:'100%'});^^ //
        $(this).text('Read less...');

    }
})} else {
    $('#divDescription').append('<div>' + dict.description + '</div>');
}

	}



    var loadbooks = function(dict) {

       Textbook.query({
			filter: '(isbn=' + dict.isbn[0].identifier + ')', //and(' + 'school_id=' + 1 +')',
			related: 'user_by_user_id'
		}).$promise.then(function (result) {
			    var search = result.resource;

			    var tosell = [];
        	    var tobuy = [];
			    var count = 0;
			    for (count; count < search.length; count++){
			        var obj = search[count];
			        if (obj.book_state == "selling") {
			            tosell.push({"user":obj.user_by_user_id.user_name,"price":obj.price,"condition":obj.condition,"email":obj.user_by_user_id.user_email});
			        };
			        if (obj.book_state == "buying") {
			            tobuy.push({"user":obj.user_by_user_id.user_name,"price":obj.price,"condition":obj.condition,"email":obj.user_by_user_id.user_email});
			        };
			    };
			    
			    
			    for(let count=0; count <2; count++){ //build for sale and looking for columns
			        
			        if (count == 0){
        	            var adding_to = document.getElementById("forsale");
        	            var looking_at = tosell;
        	            var empty_msg = "No items being sold!";
        	            var button_msg = "Buy";
        	        } else {
        	            adding_to = document.getElementById("lookingfor");
        	            looking_at = tobuy;
        	            empty_msg = "No one is looking for this item.";
        	            button_msg = "Sell To";
        	        }
        	        
        	        if (looking_at.length == 0) {
            	        var newitem = document.createElement("div");
                        newitem.className += "list-group-item list-group-item-action";
    
                        var no_user = document.createElement("p");
                        no_user.className += "list-group-item-text text-center";
                        var b = document.createElement("b");
                        t = document.createTextNode(empty_msg);
                        b.appendChild(t);
                        no_user.appendChild(b);
                        newitem.appendChild(no_user);
    
                        adding_to.appendChild(newitem);
        	        } else {

                	    for(let count=0; count < looking_at.length; count++){
                	        
                           var newitem = document.createElement("div");
                           newitem.className += "list-group-item list-group-item-action";

                           var button = document.createElement("button");
                           button.className += "btn pull-right btn-primary col-md-2";
                           
                           button.dataset.email = looking_at[count].email;
                           button.onclick = function() {
                                window.prompt("Copy to clipboard: Ctrl+C, Enter to request this book!",  this.dataset.email );
                                };
                           var t = document.createTextNode(button_msg);
                           button.appendChild(t);
                           newitem.appendChild(button);
                           
                           var div = document.createElement("div");
                           div.className += "container-fluid mybooksdiv";
    
                           var user = document.createElement("p");
                           user.className += "list-group-item-text";
                           var b = document.createElement("b");
                           t = document.createTextNode("User: ");
                           b.appendChild(t);
                           t = document.createTextNode(looking_at[count].user);
                           user.appendChild(b);
                           user.appendChild(t);
                           div.appendChild(user);
    
                           var price = document.createElement("p");
                           price.className += "list-group-item-text";
                           b = document.createElement("b");
                           t = document.createTextNode("Offer: ");
                           b.appendChild(t);
                           t = document.createTextNode("$" + looking_at[count].price);
                           price.appendChild(b);
                           price.appendChild(t);
                           div.appendChild(price);
    
                           var condition = document.createElement("p");
                           condition.className += "list-group-item-text mybooksp";
                           b = document.createElement("b");
                           t = document.createTextNode("Condition: ");
                           b.appendChild(t);
                           t = document.createTextNode(looking_at[count].condition);
                           condition.appendChild(b);
                           condition.appendChild(t);
                           div.appendChild(condition);
                            
                           newitem.appendChild(div);
                            
                           adding_to.appendChild(newitem);
    
                        }; //end for count < looking_at.length
        	        }; //end else (things in array)
			    }; //end for count < 2
			    
			    
		},function (result) { //query failed
		    var selling = document.getElementById("forsale");
		    var buying = document.getElementById("lookingfor");
		    
		    var newitem = document.createElement("div");
                    newitem.className += "list-group-item list-group-item-action";

                    var no_user = document.createElement("p");
                    no_user.className += "list-group-item-text text-center";
                    var b = document.createElement("b");
                    var t = document.createTextNode("No items being sold!");
                    b.appendChild(t);
                    no_user.appendChild(b);
                    newitem.appendChild(no_user);

                    selling.appendChild(newitem);
                    
		    newitem = document.createElement("div");
                    newitem.className += "list-group-item list-group-item-action";

                    no_user = document.createElement("p");
                    no_user.className += "list-group-item-text text-center";
                    b = document.createElement("b");
                    t = document.createTextNode("No one is looking for this item.");
                    b.appendChild(t);
                    no_user.appendChild(b);
                    newitem.appendChild(no_user);

                    buying.appendChild(newitem);
		    
		})};
		
	if (dict.isbn && dict.isbn[0].identifier) {
	loadbooks(dict);
	}

	 $scope.addBook = function (ev) {
			$mdDialog.show({
		    	controller: 'BookAddCtrl',
		    	templateUrl: 'app/booksearch/addBook.html',
		    	parent: angular.element(document.body),
		    	targetEvent: ev,
		    	locals: {
		    		book: {isbn: dict.isbn[0].identifier,
		    		       title: dict.title,
		    		       user_id: 1, //$rootScope.user.id,
		    		       image_url: dict.image,
		    		       owner: $rootScope.user.first_name,
		    		       email: $rootScope.user.email,
		    		       is_sold: false
		    		}
		    	}
			})
		};

  }).fail(function(jqxhr, textStatus, errorThrown) {
    console.log(textStatus, errorThrown);
  });
  }


});
}])


.service('allBooksHelper', ['User', '$q',

	function (User, $q) {
	    
	    this.getthings = function() {
	        var deferred = $q.defer();
	        User.query({ 
			filter: '(college_id=1)',
			related: 'book_by_user_id'
		}).$promise.then(function (result) {
		        deferred.resolve(result);
		});
		return deferred.promise;
	    }
	    
		this.build = function (tosell, tobuy) {
		    
		    for(let count=0; count <2; count++){ //build for sale and looking for columns
			        
			        if (count == 0){
        	            var adding_to = document.getElementById("forsale");
        	            var looking_at = tosell;
        	            var empty_msg = "No items being sold!";
        	            var button_msg = "Buy";
        	        } else {
        	            var adding_to = document.getElementById("lookingfor");
        	            var looking_at = tobuy;
        	            var empty_msg = "No one is looking for this item.";
        	            var button_msg = "Sell To";
        	        }
        	        
        	        if (looking_at.length == 0) {
            	        var newitem = document.createElement("div");
                        newitem.className += "list-group-item list-group-item-action";
    
                        var no_user = document.createElement("p");
                        no_user.className += "list-group-item-text text-center";
                        var b = document.createElement("b");
                        t = document.createTextNode(empty_msg);
                        b.appendChild(t);
                        no_user.appendChild(b);
                        newitem.appendChild(no_user);
    
                        adding_to.appendChild(newitem);
        	        } else {

                	    for(let count=0; count < looking_at.length; count++){
                	       var newitem = document.createElement("div");
                           newitem.className += "list-group-item list-group-item-action";
                           
                           var image = document.createElement('img');
                           image.className += "mybooksimg";
                           image.src = looking_at[count].img;
                           newitem.appendChild(image);
                           
                           var button = document.createElement("button");
                           button.className += "btn pull-right btn-primary col-md-2";
                           
                           button.dataset.email = looking_at[count].email;
                           button.onclick = function() {
                                window.prompt("Copy to clipboard: Ctrl+C, Enter to request this book!",  this.dataset.email );
                                };
                           var t = document.createTextNode(button_msg);
                           button.appendChild(t);
                           newitem.appendChild(button);
                           
                           var div = document.createElement("div");
                           div.className += "container-fluid mybooksdiv";
    
                           var title = document.createElement("p");
                           title.className += "list-group-item-text";
                           var b = document.createElement("b");
                           t = document.createTextNode("Title: ");
                           b.appendChild(t);
                           t = document.createTextNode(looking_at[count].title);
                           title.appendChild(b);
                           title.appendChild(t);
                           div.appendChild(title);
    
                           var user = document.createElement("p");
                           user.className += "list-group-item-text";
                           var b = document.createElement("b");
                           t = document.createTextNode("User: ");
                           b.appendChild(t);
                           t = document.createTextNode(looking_at[count].user);
                           user.appendChild(b);
                           user.appendChild(t);
                           div.appendChild(user);
    
                           var price = document.createElement("p");
                           price.className += "list-group-item-text";
                           b = document.createElement("b");
                           t = document.createTextNode("Offer: ");
                           b.appendChild(t);
                           t = document.createTextNode("$" + looking_at[count].price);
                           price.appendChild(b);
                           price.appendChild(t);
                           div.appendChild(price);
    
                           var condition = document.createElement("p");
                           condition.className += "list-group-item-text mybooksp";
                           b = document.createElement("b");
                           t = document.createTextNode("Condition: ");
                           b.appendChild(t);
                           t = document.createTextNode(looking_at[count].condition);
                           condition.appendChild(b);
                           condition.appendChild(t);
                           div.appendChild(condition);
                            
                           newitem.appendChild(div);
                            
                           adding_to.appendChild(newitem);
    
                        }; //end for count < looking_at.length
        	        }; //end else (things in array)
			    }; //end for count < 2
			
		},

	this.getsortval = function() {

	    
	var val = $("#sort").val();
	
	if ($("#reverse-sort").prop('checked')) {
		if (val == null || val == "Price") {
			return "-price";
		}  else {
				return "-" + val.toLowerCase();
			}
		
	} else {
		if (val == null || val == "Price") {
			return "price";
		} else {
				return val.toLowerCase();
			}
		}
	}

	

	
	    this.dynamicSort = function(property) {
	var sortOrder = 1;
	if (property[0] === "-") {
		sortOrder = -1;
		property = property.substr(1);
	}
	return function(a, b) {
		if (property.substr(1) == "price" || property.substr(0) == "price") {
			var a = parseFloat(a[property]),
				b = parseFloat(b[property]);
		} else {
			var a = a[property],
				b = b[property];
		}
		var result = (a < b) ? -1 : (a > b) ? 1 : 0;
		return result * sortOrder;
	}
}
	
	    
	    
	}
])






.controller('allbooksCTRL', [
    '$scope', '$location', '$route', '$mdToast', '$mdDialog', '$q', '$filter','User', '$rootScope', 'allBooksHelper',
    function ($scope, $location, $route, $mdToast, $mdDialog, $q, $filter,User,$rootScope, allBooksHelper) {

    var css = document.createElement("style");
    css.type = "text/css";
    css.innerHTML = ".mybooksimg { max-width: 10%; height: auto; display: inline; vertical-align: top;}";
    document.head.appendChild(css);

    var css = document.createElement("style");
    css.type = "text/css";
    css.innerHTML = ".mybooksdiv {display: inline-block; max-width:450px; }";
    document.head.appendChild(css);
    
    var css = document.createElement("style");
    css.type = "text/css";
    css.innerHTML = ".mybooksp {display: block; word-wrap: break-word; }";
    document.head.appendChild(css);
        
    var tosell = [];
    var tobuy = [];

    allBooksHelper.getthings().then(function(result) {
        
        var search = result.resource;
			     
			    for (let count = 0; count < search.length; count++){
			        var obj = search[count];
			        
			        for (let c = 0; c < obj.book_by_user_id.length; c++){
    			        if (obj.book_by_user_id[c].book_state == "selling") {
    			                tosell.push({"user":obj.user_name,"price":obj.book_by_user_id[c].price,"condition":obj.book_by_user_id[c].condition,"email":obj.user_email,"img":obj.book_by_user_id[c].image_url,"title":obj.book_by_user_id[c].title});
    			        };
    			        if (obj.book_by_user_id[c].book_state == "buying") {
        			            tobuy.push({"user":obj.user_name,"price":obj.book_by_user_id[c].price,"condition":obj.book_by_user_id[c].condition,"email":obj.user_email,"img":obj.book_by_user_id[c].image_url,"title":obj.book_by_user_id[c].title});
    			        };
			        };
			    };
        tosell = tosell.sort(allBooksHelper.dynamicSort('price'));
	    tobuy = tobuy.sort(allBooksHelper.dynamicSort('price'));
		allBooksHelper.build(tosell, tobuy);
    })	
	
	
    
    
    $("#sort").selectmenu({
		select: function(event, ui) {
            //var thing = edb.expenseDB.allExpenses;
			$(".list-group-item-action").remove();
			var sortval = allBooksHelper.getsortval();
			
			if (tosell.length !== 0 || tobuy.length !== 0 ) {
			    tosell = tosell.sort(allBooksHelper.dynamicSort(sortval));
			    tobuy = tobuy.sort(allBooksHelper.dynamicSort(sortval));
			   
				allBooksHelper.build(tosell, tobuy);
			}
		}
	});
	
	
	$("#reverse-sort").checkboxradio().click(function() {
		//var thing = edb.getTable(); not needed anymore
        //var thing = edb.expenseDB.allExpenses;
		$(".list-group-item-action").remove();
		var sortval = allBooksHelper.getsortval();
		if (tosell.length !== 0 || tobuy.length !== 0) {
			tosell = tosell.sort(allBooksHelper.dynamicSort(sortval));
			tobuy = tobuy.sort(allBooksHelper.dynamicSort(sortval));
		
			allBooksHelper.build(tosell, tobuy);
		}
	});
	 
     
     
       
}])

.controller('BookAddCtrl', [
	'$scope', '$mdDialog', '$mdToast', 'book', 'Textbook',

	function ($mdScope, $mdDialog, $mdToast, book, Textbook) {
	    $mdScope.book = angular.copy(book);

		$mdScope.info_types = [ 'selling', 'buying'];
		//if ($mdScope.contactInfo.id === '') {
		//	delete $mdScope.contactInfo;
		//}

		$mdScope.submit = function () {
		        $mdScope.book.user_id = window.localStorage.tableID;
				Textbook.create($mdScope.book).$promise.then(function () {
					$mdToast.show($mdToast.simple().content('Book saved!'));
    				$mdDialog.hide($mdScope.book);
    				window.location.reload();
				});


		};

		$mdScope.cancel = function () {
			$mdDialog.cancel();
		};
	}
])

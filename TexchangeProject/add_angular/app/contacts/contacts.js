'use strict';


angular.module('contacts', [
	'ngResource',
	'ngRoute',
	'ngMaterial',
	'ngAnimate',
	'groups',
	'contact-info'
])


.config([
	'$routeProvider',

	function ($routeProvider) {

		// Routes
		$routeProvider
			.when('/contacts', {
		    	title    	: 'Contacts',
		    	templateUrl	: 'app/contacts/contacts.html',
		    	controller 	: 'ContactsCtrl' 
		    })
		    .when('/profile', {
		    	title    	: 'Contacts',
		    	templateUrl	: 'app/contacts/user_profile.html',
		    	controller 	: 'ContactsCtrl' 
		    })
		    .when('/results/:id', {
		    	title    	: 'Results',
		    	templateUrl	: 'app/contacts/results.html',
		    	controller 	: 'ResultsCtrl',
		    	resolve		: {
		    		book: function ($route) {
		    			return { id: $route.current.params.id };
		    		}
		    	}
		    })
		    .when('/add-contact', {
		    	title		: 'Add contact',
		    	templateUrl	: 'app/contacts/contact-add-edit.html',
		    	controller 	: 'ContactsItemCtrl',
		    	resolve		: {
		    		contact: function () {
		    			return { };
		    		},
		    		groups: function (Groups) {
		    			return	Groups.query().$promise;
		    		}
		    	}
		    })
		    .when('/edit-contact/:id', {
		    	title		: 'Edit contact',
		    	templateUrl	: 'app/contacts/contact-add-edit.html',
		    	controller 	: 'ContactsItemCtrl',
		    	resolve		: {
		    		contact: function ($route) {
		    			return { id: $route.current.params.id };
		    		},
		    		groups: function (Groups) {
		    			return	Groups.query().$promise;
		    		}
		    	}
		    });

	}
])

// Contacts factory to fetch contacts data from dreamfactory services.

.factory('Contacts', [
	'$resource',

	function ($resource) {
		return $resource('/api/v2/db/_table/contact/:id', { id: '@id' }, {
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


.factory('Textbook', [
	'$resource',

	function ($resource) {
		return $resource('/api/v2/mysql/_table/textbook/:id', { id: '@id' }, {
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

// Contact group relationship factory to fetch all the records with relationship
// between contact and groups.

.factory('ContactRelationships', [
	'$resource',

	function ($resource) {
		return $resource('/api/v2/db/_table/contact_group_relationship', { }, {
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

.controller('ContactsCtrl', [
	'$scope', 'Contacts', '$location', '$route', '$mdToast', 'ContactInfo', '$q', '$filter',

	function ($scope, Contacts, $location, $route, $mdToast, ContactInfo, $q, $filter) {

		$scope.colLabels = [ 'ID', 'First Name', 'Last Name', 'Image URL', 'Twitter', 'Skype', 'Notes' ];
		$scope.colFields = [ 'id', 'first_name', 'last_name', 'image_url', 'twitter', 'skype', 'notes' ];
		$scope.altImage = 'http://uxrepo.com/static/icon-sets/ionicons/png32/128/000000/ios7-contact-128-000000.png';
		$scope.mobileActive = null;
		$scope.paginate = { page: 0, limit: 15 }
		$scope.contacts = [];

		$scope.loadData = function (page, options) {
			$scope.paginate.page = page;
			options = angular.extend({
				include_count: true,
				offset: $scope.paginate.page * $scope.paginate.limit,
				limit: $scope.paginate.limit,
				order: 'last_name ASC'
			}, options || {});

			Contacts.query(options).$promise.then(function (result) {
				if (!$scope.$root.isMobile || page === 0) {
					$scope.contacts = result.resource;	
				} else {
					$scope.contacts.push.apply($scope.contacts, result.resource);	
				}
				
				$scope.paginate.meta = result.meta;
			});
		};

		$scope.search = function (event) {
			if (event.keyCode === 13) {
				$scope.loadData(0, {
					filter: 'first_name like %' + event.target.value + '%'
				});
			}
		};

		$scope.addContact = function () {
			$location.path('/add-contact')
		};

		$scope.editContact = function (contact) {
			$location.path('/edit-contact/' + contact.id);
		};

		if ($scope.$root.isMobile) {
			$scope.$on('SCROLL_END', function () {
				$scope.loadData($scope.paginate.page+1);
			});
		}

		$scope.loadData(0);
	}
])



.controller('ResultsCtrl', [
    '$scope', 'Contacts', '$location', '$route', '$mdToast', '$mdDialog', 'ContactInfo', '$q', '$filter','book','Textbook',
    function ($scope, Contacts, $location, $route, $mdToast, $mdDialog, ContactInfo, $q, $filter,book,Textbook) {
    $(function() {
  //$.urlParam = function(name) {
    //var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    //if (results == null) {
      //return null;
    //} else {
      //return results[1] || 0;
    //}               how to call it: ($.urlParam('id')
  //};
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
      window.sessionStorage.image = dict.image;
    } else {
		$('#divDescription').append('<img src="app/contacts/not-found.png" style="float: left; padding: 10px;">');
	}
    if (dict.ebook == true) {
      $('#divDescription').append('<h2>(Ebook version)</h2>');
    }
    $('#divDescription').append('<p><b>Title:</b> ' + dict.title + '</p>');
    window.sessionStorage.title = dict.title;
    if (dict.authors != null) {
        $('#divDescription').append('<p><b>Authors:</b> ' + dict.authors.join(', ') + '</p>');
        $('#divDescription').append('<p><b>First published year:</b> ' + dict.publishedDate + '</p>');
    } else {
        $('#divDescription').append('<p><b>Authors:</b> No author info found.</p>');
    }
    $('#divDescription').append('<p><b>Publisher:</b> ' + dict.publisher + '</p>');
    // and the usual description of the book
	if (dict.description == "") {
		$('#divDescription').append('<p><b>Description:</b> No description available.</p>');
	} else{
		$('#divDescription').append('<p><b>Description:</b> ' + dict.description + '</p>');
	}
    if (dict.isbn && dict.isbn[0].identifier) {
      $('#divDescription').append('<p><b>ISBN:</b> ' + dict.isbn[0].identifier + '</p>');
      window.sessionStorage.isbn = dict.isbn[0].identifier;
      $('#divDescription').append('<a href="http://www.worldcat.org/isbn/' + dict.isbn[0].identifier + '" target="_blank">View item on worldcat</a>');
      $('#divDescription').append('<p>Some users may own this book in a different edition, <a href="http://books.google.com/books?q=editions:ISBN' + dict.isbn[0].identifier + '&id=' + dict.id + '" target="_blank">check out other versions on google</a> and search their ISBN here</p>');
    };
    if (dict.ebook != true) {
      $('#divDescription').append('<p>If this is a school textbook, and not an eBook, you can view prices from online vendors on <a href="http://www.campusbooks.com/search/'
	+ dict.isbn[0].identifier + '" target="_blank">campusbooks.com</a></p>');
    }
  }).fail(function(jqxhr, textStatus, errorThrown) {
    console.log(textStatus, errorThrown);
  });
  }
  $scope.addBook = function (ev) {
			$mdDialog.show({
		    	controller: 'BookAddCtrl',
		    	templateUrl: 'app/contacts/addBook.html',
		    	parent: angular.element(document.body),
		    	targetEvent: ev,
		    	locals: {
		    		book: {isbn: window.sessionStorage.isbn, name: window.sessionStorage.title, user_id: window.localStorage.userID, school_id: '1', image: window.sessionStorage.image }
		    	}
			})
		};
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
			
				Textbook.create($mdScope.book).$promise.then(function () {
					$mdToast.show($mdToast.simple().content('Book saved!'));
    				$mdDialog.hide($mdScope.book);
				});	
			 
			
		};

		$mdScope.cancel = function () {
			$mdDialog.cancel();
		};
	}
])

.controller('ContactsItemCtrl', [
	'$scope', 'Contacts', 'ContactInfo', 'contact', 'groups', '$mdToast', '$mdDialog', '$location', '$route', 'Groups', 'ContactRelationships', '$q',

	function ($scope, Contacts, ContactInfo, contact, groups, $mdToast, $mdDialog, $location, $route, Groups, ContactRelationships, $q) {
		$scope.contact = contact;
		$scope.groups = groups.resource;
		$scope.selectedGroups = {};

		$scope.loadData = function () {
			ContactInfo.query({ 
				include_count: true,
				filter: 'contact_id=' + $route.current.params.id 
			}).$promise.then(function (result) {
				$scope.contactInfo = result.resource;
			});
		};

		if (contact.id) {
			Contacts.get({ id: contact.id }).$promise.then(function (response) {
				$scope.contact = response;
				ContactRelationships.query({
					filter: 'contact_id=' + contact.id
				}).$promise.then(function (result) {
					result.resource.forEach(function (item) {
						$scope.selectedGroups[item.contact_group_id] = true;
					});
				});
			});

			// load contact info
			$scope.loadData();
		}

		$scope.addEditContactInfo = function (ev, item) {
			$mdDialog.show({
		    	controller: 'ContactInfoUpdateCtrl',
		    	templateUrl: 'app/contact-info/contact-info-add-edit.html',
		    	parent: angular.element(document.body),
		    	targetEvent: ev,
		    	locals: {
		    		contactInfo: item || { contact_id: $route.current.params.id }
		    	}
			}).then(function () {
				$scope.loadData();
			});
		};

		$scope.remove = function () {
			var promises = [
				ContactRelationships.remove({
					filter: 'contact_id=' + contact.id
				}).$promise,
				ContactInfo.remove({
					filter: 'contact_id=' + contact.id
				}).$promise
			];

			$q.all(promises).then(function () {
				Contacts.remove({
					id: contact.id
				}).$promise.then(function () {
					$location.path('/contacts');
				});
			});
		};

		$scope.cancel = function () {
			$location.path('/contacts');
		};


		$scope.save = function () {
			if (!contact.id) {
				// Create contact

				Contacts.create($scope.contact).$promise.then(function () {
					$mdToast.show($mdToast.simple().content('Contact saved!'));
					$location.path('/contacts');
				});
			} else {

				ContactRelationships.remove({
					filter: 'contact_id=' + contact.id
				}).$promise.then(function () {
					
					var contactGroupRelationships = Object.keys($scope.selectedGroups).filter(function (key) {
						return $scope.selectedGroups[key];
					}).map(function (key) {
						return { contact_id: contact.id, contact_group_id: key }
					});

					var promises = [
						Contacts.update({ id: $scope.contact.id }, $scope.contact).$promise,
						ContactRelationships.create(contactGroupRelationships).$promise
					];

					$q.all(promises).then(function () {
						$mdToast.show($mdToast.simple().content('Contact saved!'));
						$location.path('/contacts');
					});
				});
			}
		};
	}
]);
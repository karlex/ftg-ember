// For prevent CORS run Chrome by follow command:
// open -a /Applications/Google\ Chrome.app/ --args --disable-web-security

App = Ember.Application.create();

App.Router.map(function() {
	this.resource('user', function() {
		// user/login
		this.route('login');

		// user/:user_id
		this.resource('user.other', { path: '/:user_id' }, function() {
			// user/:user_id/friends
			this.route('friends');
		});

		// user/me
		this.resource('user.me', { path: '/me' }, function() {
			// user/me/friends
			this.route('friends');
		});
	});
});

App.UserLoginRoute = Ember.Route.extend({
	model: function() {
		return { username: '', password: '' };
	},
});

App.UserLoginController = Ember.ObjectController.extend({
	actions: {
		login: function() {
			App.User
				.login(this.get('model.username'), this.get('model.password'))
				.then(function(response) {
					console.log(response);
					if (response.status == 0) {
						this.transitionToRoute('user.me');
					} else {
						alert(response.message);
					}
				}.bind(this));
		}
	}
});

App.UserOtherRoute = Ember.Route.extend({
  	model: function(params) {
    	return [
    		{ id: 1, name: 'Peter' },
    		{ id: 2, name: 'Sam' }
    	][params.user_id - 1];
  	},

  	serialize: function(model) {
    	return { user_id: model.get('id') };
  	}
});

App.UserMeRoute = Ember.Route.extend({
  	model: function() {
  		return App.User.me();
  	}
});
App.UserMeFriendsRoute = Ember.Route.extend({
  	model: function() {
    	return App.User.all();
	}
});

App.IndexRoute = Ember.Route.extend({
  	model: function() {
    	return ['red', 'yellow', 'blue'];
  	}
});

App.User = Ember.Object.extend();
App.User.reopenClass({
	token: null,
	login: function(username, password) {
		var params = {
			username: username,
			password: password
		}
		return $.post("http://local.ftg/api/v1/user/login", params).then(function(response) {
			if (response.status == 0) {
				$.ajaxSetup({
					headers: { Authentication: 'Token ' + response.token }
				});
			}
			return response;
		});
	},
	me: function() {
		return $.getJSON("http://local.ftg/api/v1/user/me").then(function(response) {
			console.log(response);
	      	return App.User.create(response.user);
		});
	},
	all: function() {
      	return $.getJSON("http://local.ftg/api/v1/user/me/friends").then(function(response) {
      		var items = [];
	        response.items.forEach(function(item) {
	        	items.push(App.User.create(item));
	        });
	      	return items;
		});
  	}
});
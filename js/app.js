// For prevent CORS run Chrome by follow command:
// open -a /Applications/Google\ Chrome.app/ --args --disable-web-security

App = Ember.Application.create();

App.Router.map(function() {
	this.resource('user', function() {
		// user/login
		this.route('login');

		// user/:user_id
		this.resource('user.other', { path: '/' }, function() {
			// user/:user_id
			this.route('index', { path: '/:user_id' });
			// user/:user_id/friends
			this.route('friends', { path: '/:user_id/friends' });
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

App.UserOtherIndexRoute = Ember.Route.extend({
  	model: function(params) {
	    return App.User.view(params.user_id);
  	},
  	serialize: function(model) {
    	return { user_id: model.get('id') };
  	}
});

App.UserOtherFriendsRoute = Ember.Route.extend({
  	model: function(params) {
	    return App.User.friendsByUserId(params.user_id);
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
    	return App.User.myFriends();
	}
});

App.HttpRequest = {
	urlPrefix: 'http://local.ftg/api/v1/',
	prepareResponse: function(response) {
		console.log('Response', response);
		// Если пользователь не авторизован, отправляем его на форму входа
		if (response.status == 1 && response.message === 'Login Required') {
			App.Router.router.transitionTo('user.login')
		}
		return response;
	},
	get: function(url, params) {
		return $.getJSON(this.urlPrefix + url, params).then(this.prepareResponse);
	},
	post: function(url, params) {
		return $.post(this.urlPrefix + url, params).then(this.prepareResponse);
	},
	setToken: function(token) {
		$.ajaxSetup({
			headers: { Authentication: 'Token ' + token }
		});
	}
};

App.User = Ember.Object.extend();
App.User.reopenClass({
	login: function(username, password) {
		var params = {
			username: username,
			password: password
		}
		return App.HttpRequest.post('user/login', params).then(function(response) {
			if (response.status == 0) {
				App.HttpRequest.setToken(response.token);
			}
			return response;
		});
	},
	prepareUserResponse: function(response) {
		if (response.status == 0) {
			return App.User.create(response.user);
		}
	},
	prepareUsersResponse: function(response) {
		if (response.status == 0) {
	        return response.users.map(function(item) {
	        	return App.User.create(item);
	        });
	    }
	},
	me: function() {
		return App.HttpRequest.get('user/me').then(this.prepareUserResponse);
	},
	myFriends: function() {
      	return App.HttpRequest.get('user/me/friends').then(this.prepareUsersResponse);
  	},
  	view: function(userId) {
		return App.HttpRequest.get('user/' + userId).then(this.prepareUserResponse);
	},
  	friendsByUserId: function(userId) {
  		return App.HttpRequest.get('user/' + userId + '/friends').then(this.prepareUsersResponse);
  	}
});
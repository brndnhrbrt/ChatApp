angular.module('userCtrl', ['userService'])
	.filter('reverse', function() {
		return function(items) {
			return items.slice().reverse();
		};
	})
	.controller('chatController', ['$scope', function($scope) {

		var vm = this;
		vm.messages = [];
		vm.usernames = [];
		vm.messageData = {};
		vm.userCount = 0;
		vm.myName = "New User";
		vm.userPanelStatus = 'hide';
		// var socket = io('http://96.247.32.133:3001');
		var socket = io('http://localhost:3001');
		// var socket = io('http://www.sherbertpi.com:3001');

		vm.hideUserPanel = function() { 
			if(vm.userPanelStatus == 'hide')
				vm.userPanelStatus = 'show';
			else
				vm.userPanelStatus = 'hide'
		}

		vm.getTime = function() {
			var d = new Date();
			var month = d.getMonth();
			var day = d.getDate();
			var hours = d.getHours();
			var min = d.getMinutes();
			var sec = d.getSeconds();
			var suf = 'PM';
			hours > 12 ? hours = hours - 12: suf = 'AM';	
			date = 'Date: '+month+'/'+day+' &nbsp '+hours+':'+min+'.'+sec+' '+suf; 
			date = ''+hours+':'+min+':'+sec+' '+suf;
			return date; 
		}

		vm.setName = function(name) {
			vm.myName = name;
		}

		vm.addMessage = function(username) {
			
			if(typeof vm.messageData.image == 'undefined')
				vm.messageData.image = 'http://i.imgur.com/S2MbJw6.png';

			var msg = 	{
				username: username,
				message: vm.messageData.message,
				image: vm.messageData.image,
				date: vm.getTime()
			};

			vm.messages.push(msg);
			socket.emit('give-message', msg.username, msg.message, msg.image);
			vm.messageData = {}
		};

		vm.addSocketMessage = function(username, message, image) {
			vm.messages.push({
				username: username,
				message: message,
				image: image,
				date: vm.getTime()
			});

			vm.messageData = {};
			$scope.$apply();
		}

		waitToSend = function(s, t) {
			setTimeout(
				function() {
					s.emit('send-name', vm.myName);
				}, t
			);
		}

		vm.initSocket = function() {
			var disc = false;
			socket.on('connect', function() {
				waitToSend(socket, 3000);
				console.log('socket connected');
				// if(disc)
				// 	vm.initSocket();
			});

			socket.on('update-names', function(names) {
				vm.usernames = names;
				$scope.$apply();
			});

			socket.on('update-server-names', function() {
				waitToSend(socket, 0);
			});

			socket.on('disconnect', function() {
				disc = true;
				console.log('socket disconnected');
			});

			socket.on('new-message', function(username, message, image) {
				vm.addSocketMessage(username, message, image);
			});

			socket.on('userCount', function(count) {
				vm.userCount = count;
				$scope.$apply();
			});
		}

		setTimeout(
			function() {
				vm.initSocket();
		    },
		    0
	    );

	}])
	.controller('userController', function(User) {
		var vm = this;
		vm.processing = true;

		User.all()
			.success(function(data) {
				vm.processing = false;
				vm.users = data;
			});

		vm.deleteUser = function(id) {
			vm.processing = true;

			User.delete(id)
				.success(function(data) {
					User.all()
						.success(function(data) {
							vm.processing = false;
							vm.users = data;
						});
				});
		};
	})
	.controller('userCreateController', function(User, $location) {
		var vm = this;
		vm.type = 'create';

		vm.saveUser = function() {
			vm.processing = true;
			vm.message = '';

			User.create(vm.userData)
				.success(function(data) {
					vm.processing = false;
					vm.userData = {};
					vm.message = data.message;
				});	
		};	

		vm.register = function() {
			vm.processing = true;
			vm.message = '';

			User.register(vm.userData)
				.success(function(data) {
					vm.processing = false;
					vm.userData = {};
					vm.message = data.message;
					$location.path('/login');
				});	
		}
})

.controller('userEditController', function($routeParams, User) {

	var vm = this;
	vm.type = 'edit';

	User.get($routeParams.user_id)
		.success(function(data) {
			vm.userData = data;
		});

	vm.saveUser = function() {
		vm.processing = true;
		vm.message = '';

		User.update($routeParams.user_id, vm.userData)
			.success(function(data) {
				vm.processing = false;
				vm.userData = {};
				vm.message = data.message;
			});
	};
});

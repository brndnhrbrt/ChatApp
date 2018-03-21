angular.module('mainCtrl', [])
	.controller('mainController', function($rootScope, $location, Auth) {
		var vm = this;
		vm.loggedIn = Auth.isLoggedIn();

		$rootScope.$on('$routeChangeStart', function() {
			vm.loggedIn = Auth.isLoggedIn();	

			Auth.getUser()
				.then(function(data) {
					vm.user = data.data;
				});	
		});	

		vm.doLogin = function() {
			vm.processing = true;
			vm.error = '';
	
			Auth.login(vm.loginData.username, vm.loginData.password)
				.success(function(data) {
					vm.processing = false;			
					if (data.success)			
						$location.path('/users');
					else 
						vm.error = data.message;
			});
		};

		vm.doRegister = function() {
			vm.processing = true;
			vm.error = '';
	
			Auth.register(vm.loginData.username, vm.loginData.password)
				.success(function(data) {
					vm.processing = false;			
					if (data.success)			
						$location.path('/users');
					else 
						vm.error = data.message;
			});
		};

		vm.doLoginAdmin = function() {
			vm.processing = true;
			vm.error = '';
	
			Auth.loginAdmin(vm.loginData.username, vm.loginData.password)
				.success(function(data) {
					vm.processing = false;			
					if (data.success)			
						$location.path('/usersAdmin');
					else 
						vm.error = data.message;
			});
		};

		vm.doLogout = function() {
			Auth.logout();
			vm.user = '';
			
			$location.path('/login');
		};

		vm.createSample = function() {
			Auth.createSampleUser();
		};
});

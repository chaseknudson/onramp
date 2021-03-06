

function UserProfile(data) {
	var self = this;
	self.id = ko.observable(data['user_id']);
	self.username = ko.observable(data['username']);
	self.fullName = ko.observable(data['full_name']);
	self.email = ko.observable(data['email']);
	self.isAdmin = ko.observable(data['is_admin']);
	self.isEnabled = ko.observable(data['is_enabled']);
	self.password = ko.observable('**********'); //fake security

	self.auth_data = sessionStorage['auth_data'];

	self.Workspacelist = ko.observableArray();
	self.Jobslist = ko.observableArray();
	self.PCEslist = ko.observableArray();
	self.Moduleslist = ko.observableArray();

	self.viewUser = function () {
		// go to manage users page and start with this user
		window.location.href = "admin_users.html";
	};

	self.editUser = function () {
		// get all user data
		// start with some dummy data



		// get jobs for this user
		$.getJSON( sessionStorage.server + "/users/" + self.id() + "/jobs?apikey=" + JSON.parse(self.auth_data).apikey,
								//self.auth_data,
								function (data){
									// {"status": 0,
									//  "status_message": "Success",
									//  "users": {
									//    "fields": ["user_id", "username", "full_name", "email", "is_admin", "is_enabled"],
									//    "data": [2, "alice", "", "", 0, 1]}}
									console.log(JSON.stringify(data));
									// Remove all jobs from the list and re-populate
									self.Jobslist.removeAll();
									for (var x = 0; x < data.users.data.length; x++){
										var raw = data.users.data[x];
										console.log(raw);
										var conv_data = {};
										for(var i = 0; i < data.users.fields.length; i++){
											console.log("adding: " + data.users.fields[i] + " = " + raw[i]);
											conv_data[data.users.fields[i]] = raw[i];
										}
										self.Jobslist.push(new Job(conv_data, true, false));
									}
								}
							);

		// get workspaces for this user
		$.getJSON( sessionStorage.server + "/users/" + self.id() + "/workspaces?apikey=" + JSON.parse(self.auth_data).apikey,
								//self.auth_data,
								function (data){
									// {"status": 0,
									//  "status_message": "Success",
									//  "users": {
									//    "fields": ["user_id", "username", "full_name", "email", "is_admin", "is_enabled"],
									//    "data": [2, "alice", "", "", 0, 1]}}
									console.log(JSON.stringify(data));
									// Make sure when we refresh all workspaces in the table are removed
									self.Workspacelist.removeAll();
									for (var x = 0; x < data.users.data.length; x++){
										var raw = data.users.data[x];
										console.log(raw);
										var conv_data = {};
										for(var i = 0; i < data.users.fields.length; i++){
											console.log("adding: " + data.users.fields[i] + " = " + raw[i]);
											conv_data[data.users.fields[i]] = raw[i];
										}
										self.Workspacelist.push(new Workspace(conv_data, true));
									}
								}
							);
	};

	self.complete_func = function (data){
      // packet structure:
      //   data.status = the status code (200 is good)
      //   data.responseText = the JSON data from the server
      //     data.responseText.status = server's status code (0 = successful login)
      //     data.responseText.status_message = server's status message
      //     data.responseText.auth = JSON object with authentication info (NEED TO SEND WITH ALL FUTURE CALLS)
      //     data.responseText.auth.username = username
      //     data.responseText.auth.apikey = special code to know that this user is authenticated
      //     data.responseText.auth.user_id = user id from the server
      //     data.responseText.auth.session_id = session id used by the server
      console.log(JSON.stringify(data));
      console.log(data.responseText);
      console.log(data["responseText"]);
      console.log(data.status + 5);
      if(data.status == 200){
        alert("Success!");
      }
      else if(data.status == 401){
        alert("Incorrect login info.  Please try again, or contact the admin to create or reset your account.");
      }
      else {
        alert("Something went wrong with the sending or receiving of the ajax call.  Status code: " + data.status);
      }

    };

	self.updateServer = function () {
		// this will push the user info to the server as a new user
		$.ajax({
	      	type: 'POST',
	      	url: sessionStorage.server + '/admin/user?apikey=' + JSON.parse(this.auth_data).apikey,     
			data: JSON.stringify({
				'auth': JSON.parse(self.auth_data), 
				'password':this.password(), 
				'username':this.username(), 
				'is_admin':this.isAdmin(), 
				'is_enabled':this.isEnabled(),
		 		'email':this.email(), 
				'full_name':this.fullName(), 
				'user_id':this.id()}),
	      	complete: self.complete_func,
	      	dataType: 'application/json',
	      	contentType: 'application/json'
	  	});
	}

	self.removeFromWorkspace = function () {
		// this is the workspace object
		self.Workspacelist.remove(this);
		alert("removing " + self.username() + " from workspace " + this.name);
	}

	self.removeOnServer = function () {
		//alert("not implemented");
		// For now it just disables the user not deletes them
		//var remove = confirm("Remove " + self.username() + " from the server?");

		// For now just make request to update user and set is_enabled to false
		$.ajax({
      		type: 'POST',
      		url: sessionStorage.server + '/admin/user?apikey=' + JSON.parse(this.auth_data).apikey,
      		data: JSON.stringify({
				'auth': JSON.parse(self.auth_data),
				'user_id':this.id(),
				'is_enabled':false
			}),
      		complete: self.complete_func,
      		dataType: 'application/json',
      		contentType: 'application/json'
	  	} );
		this.isEnabled(false);
	  

	}

	}



	function AdminUserViewModel() {
		var self = this;
		self.username = sessionStorage['UserID'];
		self.userID = sessionStorage['UserID'];
		self.auth_data = sessionStorage['auth_data'];

		self.selectedUser = ko.observable();

		self.Userslist = ko.observableArray();

		self.changeUser = function () {
			self.selectedUser(null);
		};

		self.selectUser = function () {
			self.selectedUser(this);
			this.editUser();
		}

		self.deleteUser = function () {
			// tell server to delete this user
			//self.Userslist.remove(this);
			if (self.selectedUser() == this) {
				self.selectedUser(null);
			}
			this.removeOnServer();
		}

		self.addUser = function () {
			// need to get user ID from the server, maybe not until data is populated?
			var newUser = new UserProfile({'id':-1, 'username': 'username', 'full_name' : 'fullName', 'email':'email', 'isAdmin': false});
			self.Userslist.push(newUser);
			self.selectedUser(newUser);
		}

		$(document).ready( function () {
			// reinitialize values
			self.Userslist([]);

			// get data from server
			// some hard coded data for now...
			$.getJSON( sessionStorage.server + "/users?apikey=" + JSON.parse(self.auth_data).apikey,
						//self.auth_data,
						function (data){
						// {"status": 0,
						//  "status_message": "Success",
						//  "users": {
						//    "fields": ["user_id", "username", "full_name", "email", "is_admin", "is_enabled"],
						//    "data": [2, "alice", "", "", 0, 1]}}
							console.log(JSON.stringify(data));
							for (var x = 0; x < data.users.data.length; x++){
								var raw = data.users.data[x];
								console.log(raw);
								var conv_data = {};
								for(var i = 0; i < data.users.fields.length; i++){
									console.log("adding: " + data.users.fields[i] + " = " + raw[i]);
									conv_data[data.users.fields[i]] = raw[i];
								}
								self.Userslist.push(new UserProfile(conv_data));
							}
						}
			);
		});

		

	}

	// Activates knockout.js
	ko.applyBindings(new AdminUserViewModel());

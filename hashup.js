
var hasher = require('password-hash-and-salt'); 


var password = "test"; 

hasher(password).hash(function(error, hash) {

	console.log(hash);
}); 

var pg = require('pg');
var DogeAPI = require('dogeapi');
var settings = require('./settings.js')

var dogeAPI = new DogeAPI({
							apikey: settings.dogeApiKey,
							endpoint: 'https://dogeapi.com/'
						});

console.log("STARTING VALIDATOR");

// Postgres Setup
var postgres_client = new pg.Client(process.env.DATABASE_URL || "postgres://localhost:5432/duelyst_dogecoin");
postgres_client.connect(function(err) {

	if(err) {
		console.log('could not connect to postgres', err);
		return;
	}

	console.log("grabbing pledges to validate from DB");

	postgres_client.query('SELECT * FROM pledges WHERE validated = false LIMIT 500',function(error, result) {
		if(error) {
			console.log(error);
		} else {
			for (var i=0; i<result.rows.length; i++) {
				var address = result.rows[i]["wallet_address"];
				var id = result.rows[i]["id"];
				// console.log("validating ("+address+")");
				dogeAPI.getAddressReceived(address, null, function (error, response) {
					var amount_received = JSON.parse(response)["data"]["received"];
					console.log("validated amount for address ("+address+") = "+amount_received);
					if (amount_received) {
						postgres_client.query('UPDATE pledges SET validated_wallet_amount=$1,validated=true WHERE id=$2', [amount_received,id],function(err, result) {});
					}
				});
			}
		}

		postgres_client.end();
	});

});
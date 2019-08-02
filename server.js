/*
|--------------------------------------------------------------------------
| Global APP Init
|--------------------------------------------------------------------------
*/
	global._directory_base = __dirname;
	global.config = {};
		  config.app = require( './config/app.js' );
		  config.database = require( './config/database.js' )[config.app.env];

/*
|--------------------------------------------------------------------------
| APP Setup
|--------------------------------------------------------------------------
*/
	// Node Modules
	const BodyParser = require( 'body-parser' );
	const Express = require( 'express' );
	const Mongoose = require( 'mongoose' );

	// Primary Variable
	const App = Express();
	var kafka = require("kafka-node"),
	Producer = kafka.Producer,
	client = new kafka.KafkaClient(),
	producer = new Producer(client);

	let count = 0;

	producer.on("ready", function() {
		console.log("ready");
		setInterval(function() {
			payloads = [
				// { topic: "test", messages: `I have ${count} cats`, partition: 0 }
				{
					topic: "test",
					messages: {
						nama_lengkap: "ABC",
						umur: 11
					},
					partition: 1
				}
			];

			producer.send( payloads, function( err, data ) {
				console.log( "Send to kafka" );
				// console.log( "HEHEHEHEHE" );
				// console.log( data );
				// count += 1;
			});
		}, 2000);
	});

	producer.on("error", function(err) {
		console.log(err);
	});
/*
|--------------------------------------------------------------------------
| APP Init
|--------------------------------------------------------------------------
*/
	// Parse request of content-type - application/x-www-form-urlencoded
	App.use( BodyParser.urlencoded( { extended: false } ) );

	// Parse request of content-type - application/json
	App.use( BodyParser.json() );

	// Setup Database
	Mongoose.Promise = global.Promise;
	Mongoose.connect( config.database.url, {
		useNewUrlParser: true,
		ssl: config.database.ssl
	} ).then( () => {
		console.log( "Database :" );
		console.log( "\tStatus \t\t: Connected" );
		console.log( "\tMongoDB URL \t: " + config.database.url + " (" + config.app.env + ")" );
	} ).catch( err => {
		console.log( "Database :" );
		console.log( "\tDatabase Status : Not Connected" );
		console.log( "\tMongoDB URL \t: " + config.database.url + " (" + config.app.env + ")" );
	} );

	// Server Running Message
	App.listen( parseInt( config.app.port[config.app.env] ), () => {
		console.log( "Server :" );
		console.log( "\tStatus \t\t: OK" );
		console.log( "\tService \t: " + config.app.name + " (" + config.app.env + ")" );
		console.log( "\tPort \t\t: " + config.app.port[config.app.env] );
	} );

	// Routing
	require( './routes/api.js' )( App );
	module.exports = App;
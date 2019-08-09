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
	Consumer = kafka.Consumer,
	client = new kafka.KafkaClient({kafkaHost : "149.129.252.13:9092"}),
	producer = new Producer(client),    
	consumer = new Consumer(
        client,
        [
            { topic: 'kafkaRequestData', partition: 0 },{ topic: 'kafkaResponse', partition: 0 }
        ],
        {
            autoCommit: false
        }
    );
	consumer.on('message', function (message) {
		console.log(message,JSON.parse(message.value));
	});

	let count = 0;
	let reqObj = {
		"data_source":[{
			"msa_name":"auth",
			"model_name":"UserAuth"
		},{
			"msa_name":"finding",
			"model_name":"FindingModel"
		}],
		"query":"SELECT * FROM auth a JOIN finding f ON f.INSERT_USER=a.USER_ID",
		"requester":"finding",
		"request_id":0
	}
	let reqDataObj = {
		"queue_id":0,
		"msa_name":"finding",
		"model_name":"FindingModel",
		"agg":{}
	}
	//{ topic: "kafkaResponseData", messages: JSON.stringify(reqDataObj), partition: 0 }

	producer.on("ready", function() {
		console.log("ready",reqObj.toString());
		setInterval(function() {
			payloads = [
				{ topic: "kafkaRequest", messages: JSON.stringify(reqDataObj), partition: 0 }
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
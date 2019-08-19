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
	var data_source_request = {
		"auth":false,
		"finding":false
	}
	var kafka = require("kafka-node"),
	Producer = kafka.Producer,
	Consumer = kafka.Consumer,
	client = new kafka.KafkaClient({kafkaHost : "149.129.252.13:9092"}),
	producer = new Producer(client),    
	consumer = new Consumer(
        client,
        [
            { topic: 'kafkaRequestData', partition: 0 },{ topic: 'kafkaDataCollectionProgress', partition: 0 },{ topic: 'kafkaResponse', partition: 0 }
        ],
        {
            autoCommit: false
        }
    );
	consumer.on('message', function (message) {
		json_message = JSON.parse(message.value);
		if(message.topic=="kafkaRequestData"){
			//ada yang request data ke microservices
			let reqDataObj;
			let responseData = false;
			if(json_message.msa_name=="finding"){
				reqDataObj = {
					"msa_name":"finding",
					"requester":"finding",
					"request_id":1,
					"data":[
						{
							"FINDING_CODE":"123",
							"CREATOR":"01"
						},
						{
							"FINDING_CODE":"124",
							"CREATOR":"02"
						},
					]
				}
				responseData = true;
			}
			else if(json_message.msa_name=="auth"){
				reqDataObj = {
					"msa_name":"auth",
					"requester":"finding",
					"request_id":1,
					"data":[
						{
							"CREATOR":"01",
							"NAME":"FER"
						},
						{
							"CREATOR":"02",
							"NAME":"FER2"
						},
					]
				}
				responseData = true;
			}
			if(responseData){
				//lempar data microservices ke spark
				let payloads = [
					{ topic: "kafkaResponseData", messages: JSON.stringify(reqDataObj), partition: 0 }
				];
				/*producer.send( payloads, function( err, data ) {
					console.log( "Send data to kafka",data );
				});*/
			}
		}
		else if(message.topic=="kafkaDataCollectionProgress"){
			//update progress data collection
			let data_complete = true;
			data_source_request[json_message.msa_name] = true;
			for(let x in data_source_request){
				if(data_source_request[x]==false){
					data_complete = false;
				}
			}
			/*if(data_complete){
				var SSH = require('simple-ssh');

				var ssh = new SSH({
					host: '149.129.252.13',
					user: 'root',
					pass: 'T4pagri123'
				});

				ssh.exec('/root/spark/bin/spark-submit /root/pyspark/code/collecting.py requester=finding/request_id=1 > /root/pyspark/output/log.txt', {
					out: function(stdout) {
						console.log(stdout);
					}
				}).start();
			}*/
		}
		else if(message.topic=="kafkaResponse"){
			console.log(message,json_message);
		}
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
		"request_id":1
	}

	producer.on("ready", function() {
		//console.log(JSON.stringify(reqObj));
		//setInterval(function() {
			//minta data
			payloads = [
				{ topic: "kafkaRequest", messages: JSON.stringify(reqObj), partition: 0 }
			];

			/*producer.send( payloads, function( err, data ) {
				console.log( "Send to kafka request data" );
			});*/
		//}, 2000);
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
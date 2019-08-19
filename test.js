var kafka = require("kafka-node"),
	Producer = kafka.Producer,
	Consumer = kafka.Consumer,
	client = new kafka.KafkaClient({kafkaHost : "149.129.252.13:9092"}),
	producer = new Producer(client),    
  consumer = new Consumer(client, [{ topic: "kafkaResponse", partition: 0 }], {
    autoCommit: false
  });

let reqDataObj = {
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
			"NAME":"FER"
		},
	]
}
consumer.on("message", function(message) {
  console.log(message);
  
/** { topic: 'cat', value: 'I have 385 cats', offset: 412, partition: 0, highWaterOffset: 413, key: null } */

});
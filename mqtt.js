import * as mqtt from "mqtt"; // import everything inside the mqtt module and give it the namespace "mqtt"
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const options = {
  port: process.env.MQTT_PORT,
  clientId: 'cgobinak',
  rejectUnauthorized: false,
  ca: fs.readFileSync('./ca.crt'),
};

const client = mqtt.connect(process.env.MQTT_BROKER_URL, options);

// console.log('MQTT client created');
// console.log(client);



// client.on('connect', () => {
//   console.log('Connected to MQTT broker');
// });

client.on('message', (topic, message) => {
  console.log(`Received message: ${message.toString()} on topic: ${topic}`);
});

client.on('error', (err) => {
  console.log('Connection error:', err);
});

// client.on('offline', () => {
//   console.log('Client is offline');
// });

// client.publish('test/topic', 'Hello MQTT', (err) => {
//   if (err) {
//     console.log('Publish error:', err);
//   } else {
//     console.log('Message published successfully');
//   }
// });

function subscribeToTopic(topic) {
  client.subscribe(topic, {

  }, (err) => {
    if (err) {
      console.log('Subscription error:', err);
    } else {
      console.log(`Subscribed to topic ${topic}`);
    }
  });
}

function connectToMQTT() {
  return new Promise((resolve, reject) => {
    client.on('connect', () => {
      // console.log('Connected to MQTT broker');
      resolve(true);
    });

    client.on('error', (err) => {
      console.log('Connection error:', err);
      resolve(false);
    });
  });
}


function publishMessage(topic, message) {
  client.publish(topic, message, (err) => {
    if (err) {
      console.log('Publish error:', err);
    } else {
      console.log(`Message published successfully to topic ${topic}`);
    }
  });
}

connectToMQTT();

export { publishMessage, connectToMQTT };

// export default client;

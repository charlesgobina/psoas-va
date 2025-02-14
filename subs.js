import mqtt from "mqtt";
import fs from "fs";
import axios from "axios";

// MQTT options
const options = {
  port: 443,
  clientId: 'cgobinak-' + Math.random().toString(16).substr(2, 8), // Ensure unique client ID
  rejectUnauthorized: false,
  ca: fs.readFileSync('./ca.crt'), // Verify correct path
};

// MQTT Broker URL
const brokerUrl = 'mqtts://mqtt.cgobinak.rahtiapp.fi';
const topic = 'vacant/allapartments';

// Discord webhook URL
const discordWebhookUrl = 'https://discord.com/api/webhooks/1316911925765869679/41nef5efwuBNChp7ymXGnCNMx_6rkWHUud-Cu73xeFg3ryTJ80SQpOYsDCL-xggsfTmM';

// Format the Discord message
const formatDiscordMessage = (message) => ({
  content: '**🏢 Apartment Vacancy Update**',
  embeds: [
    {
      color: 0x1abc9c, // Embed color
      title: 'Details of Available Apartments',
      fields: [
        { name: `📅 Date: ${message.date || 'N/A'}`, value: '\u200b', inline: false },
        { name: `⏰ Time: ${message.time || 'N/A'}`, value: '\u200b', inline: false },
        { name: `📊 Total Vacant: ${message.count || 0}`, value: '\u200b', inline: false },
        { name: `🏠 Shared Apartments: ${message.shared || 0}`, value: '\u200b', inline: false },
        { name: `🛏️ Studio Apartments: ${message.studio || 0}`, value: '\u200b', inline: false },
        { name: `👨‍👩‍👧‍👦 Family Apartments: ${message.family || 0}`, value: '\u200b', inline: false },
        { name: '🔗 Link', value: `[View Apartments](https://www.psoas.fi/en/apartments/?_sfm_huoneistojen_tilanne=vapaa_ja_vapautumassa)`, inline: false },
      ],
      footer: { text: 'Vacancy data received via MQTT' },
      timestamp: new Date().toISOString(),
    },
  ],
});

// Send message to Discord
async function sendToDiscord(message) {
  try {
    const parsedMessage = JSON.parse(message);
    console.log("Parsed MQTT message:", parsedMessage);

    const payload = formatDiscordMessage(parsedMessage);
    console.log("Payload for Discord:", payload);

    await axios.post(discordWebhookUrl, payload);
    console.log('Message successfully sent to Discord!');
  } catch (error) {
    console.error('Error sending message to Discord:', error.message);
  }
}

// Connect to MQTT broker
const client = mqtt.connect(brokerUrl, options);

// Handle connection
client.on('connect', () => {
  console.log('Connected to MQTT broker');
  client.subscribe(topic, {}, (err) => {
    if (err) {
      console.error('Subscription error:', err);
    } else {
      console.log(`Subscribed to topic: ${topic}`);
    }
  });
});

// Listen for messages and forward to Discord
client.on('message', (receivedTopic, message) => {
  console.log(`Received message on topic '${receivedTopic}': ${message.toString()}`);
  sendToDiscord(message.toString());
});

// Handle connection errors
client.on('error', (err) => {
  console.error('Connection error:', err);
});

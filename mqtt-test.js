import mqtt from "mqtt";

const host = "mqtts://buzzing-white-baboon.rmq5.cloudamqp.com:8883";
const username = "ekesgswb";
const password = "49t_Wpm97BHV9nbp_BPtEWfMgPhAlsCk";

const client = mqtt.connect(host, {
  username,
  password,
  protocol: "mqtts",
  rejectUnauthorized: true
});

client.on("connect", () => {
  console.log("connected");
  client.subscribe("test");
  client.publish("test", "hello world");
});

client.on("error", err => {
  console.error("error", err);
})
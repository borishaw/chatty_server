const express = require('express');
const SocketServer = require('ws').Server;
const uuid = require('uuid/v1');
const randomColor = require('randomcolor');

// Set the port to 3001
const PORT = 3001;

//Set the port to 5000 for Heroku
// const PORT = 5000;

// Create a new express server
const server = express()
// Make the express server serve static assets (html, javascript, css) from the /public folder
  .use(express.static('public'))
  .listen(process.env.PORT || 5000, () => console.log(`Listening on ${ PORT }`));

// Create the WebSockets server
const wss = new SocketServer({
  server: server,
  clientTracking: true
});

// Set up a callback that will run when a client connects to the server
// When a client connects they are assigned a socket, represented by
// the ws parameter in the callback.

wss.broadcast =  (data, ws) => {
  wss.clients.forEach(function each(client) {
    if (client.readyState === ws.OPEN) {
      client.send(data);
    }
  });
};

wss.on('connection', (ws) => {

  ws.userNameColor = randomColor();

  const numberOfOnlineUsers = {
    type: "numberOfOnlineUsers",
    content: wss.clients.size
  };
  wss.broadcast(JSON.stringify(numberOfOnlineUsers), ws);

  ws.send(JSON.stringify({
    type: "userColor",
    content: randomColor()
  }));

  console.log('Client connected');
  ws.on('message',  (message) => {
    console.log(message);
    const newMessage = JSON.parse(message);
    switch (newMessage.type) {
      case "postMessage":
        newMessage.id = uuid();
        newMessage.type = "incomingMessage";
        wss.broadcast(JSON.stringify(newMessage) ,ws);
        break;
      case "postNotification":
        const newNotification = {
          type: "incomingNotification",
          content: newMessage.content
        };
        wss.broadcast(JSON.stringify(newNotification), ws);
        break;
      default:
        throw new Error("Unknown Type: " + newMessage.type);
    }
  });

  // Set up a callback for when a client closes the socket. This usually means they closed their browser.
  ws.on('close', () => {

    const numberOfOnlineUsers = {
      type: "numberOfOnlineUsers",
      content: wss.clients.size
    };
    wss.broadcast(JSON.stringify(numberOfOnlineUsers), ws);

    console.log('Client disconnected')
  });
});
const term = require("terminal-kit").terminal;
const spChars = require("terminal-kit").spChars;
const ScreenBuffer = require("terminal-kit").ScreenBuffer;
const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 8080 });

const cursorBlock = spChars.fullBlock;

var screen = ScreenBuffer.create({
  dst: term,
  width: term.width,
  height: term.height - 2,
  noFill: false
});

let numColor = 1;
wss.on("connection", function connection(ws) {
  let myColor = numColor;
  numColor++;

  ws.on("message", function incoming(mess) {
    let message = JSON.parse(mess);
    if (message.type == "initialData") {
    }

    if (message.type == "command") {
      wss.broadcast(
        JSON.stringify({
          type: "write",
          data: { color: myColor, ...message.data }
        })
      );
    }
  });
});

// Broadcast to all.
wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};

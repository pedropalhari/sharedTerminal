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

for (let i = 0; i < 100; i++) term(cursorBlock).color(i);

let numColor = 1;
wss.on("connection", function connection(ws) {
  let myColor = numColor;
  numColor++;

  if (numColor > 4) numColor = 0;

  ws.on("message", function incoming(mess) {
    let message = JSON.parse(mess);
    if (message.type == "initialData") {
      let arrayDump = [];
      for (let i = 0; i < screen.height; i++)
        for (let j = 0; j < screen.width; j++)
          arrayDump.push({
            x: j,
            y: i,
            obj: screen.get({ x: j, y: i })
          });
      ws.send(JSON.stringify({ type: "initialData", data: arrayDump }));
    }

    if (message.type == "command") {
      wss.broadcast(
        JSON.stringify({
          type: "write",
          data: { color: myColor, ...message.data }
        })
      );

      let { curx, cury, color, str } = message.data;
      screen.put(
        {
          x: curx,
          y: cury,
          dx: 0,
          attr: {
            // Both foreground and background must have the same color
            bgColor: 0,
            color: myColor
          }
        },
        str
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

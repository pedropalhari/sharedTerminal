const term = require("terminal-kit").terminal;
const spChars = require("terminal-kit").spChars;
const ScreenBuffer = require("terminal-kit").ScreenBuffer;
const WebSocket = require("ws");
const ws = new WebSocket(process.argv[0] ? `ws://${process.argv[0]}` : "ws://localhost:8080");
const cursorBlock = spChars.fullBlock;

var screen = ScreenBuffer.create({
  dst: term,
  width: term.width,
  height: term.height - 2,
  noFill: false
});

/* console.log(cursorBlock);
process.exit();
 */

ws.on("open", function open() {
  ws.send(
    JSON.stringify({
      type: "initialData"
    })
  );

  term.on("key", function(name, matches, data) {
    if (name === "CTRL_C") {
      terminate();
    }

    ws.send(
      JSON.stringify({
        type: "command",
        data: {
          curx: curx,
          cury: cury,
					str: charBelowCursor.char,
					color: charBelowCursor.color
        }
      })
    );

    let isMoving = false;
    if (name === "UP") {
      isMoving = true;
      cury--;
    }
    if (name === "DOWN") {
      isMoving = true;
      cury++;
    }
    if (name === "LEFT") {
      isMoving = true;
      curx--;
    }
    if (name === "RIGHT") {
      isMoving = true;
      curx++;
    }
    if (name === "BACKSPACE") {
      isMoving = true;
      curx--;

      //putCursor(" ");
    }

    if (!isMoving) {
      ws.send(
        JSON.stringify({
          type: "command",
          data: {
            curx: curx,
            cury: cury,
            str: name
          }
        })
      );
      curx++;
    }

    let auxCharBelowCursor = screen.get({ x: curx, y: cury });

    if (auxCharBelowCursor.char != cursorBlock)
      charBelowCursor = auxCharBelowCursor;

    //Unico putCursor vazio, se não fode manter o caracter de cima
    ws.send(
      JSON.stringify({
        type: "command",
        data: {
          curx: curx,
          cury: cury,
          str: cursorBlock
        }
      })
    );
  });
});

ws.on("message", function incoming(mess) {
  let message = JSON.parse(mess);

  if (message.type == "write") {
    let { curx, cury, color, str } = message.data;
    screen.put(
      {
        x: curx,
        y: cury,
        dx: 0,
        attr: {
          // Both foreground and background must have the same color
          bgColor: 0,
          color: color
        }
      },
      str
    );
    screen.draw();
  }
});

screen.fill({
  attr: {
    color: 0,
    bgColor: 0
  }
});

term.setCursorColor(0);
term.grabInput(true);

function terminate() {
  term.grabInput(false);
  setTimeout(function() {
    process.exit();
  }, 100);
}

let curx = 1,
  cury = 1,
  charBelowCursor = { char: " " };

function putCursor(str = cursorBlock, attr = null) {
  screen.put(
    {
      x: curx,
      y: cury,
      dx: 0,
      attr:
        attr == null
          ? {
              // Both foreground and background must have the same color
              bgColor: 0,
              color: 1
            }
          : attr
    },
    str
  );
}

//screen.draw();

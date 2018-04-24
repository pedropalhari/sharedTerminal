const term = require("terminal-kit").terminal;
const spChars = require("terminal-kit").spChars;
const ScreenBuffer = require("terminal-kit").ScreenBuffer;
const WebSocket = require("ws");
const ws = new WebSocket("ws://localhost:8080");
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

let backSpace = false;
ws.on("open", function open() {
  ws.send(
    JSON.stringify({
      type: "initialData"
    })
  );

  term.on("key", function(name, matches, data) {
    if (name === "CTRL_C") {
      terminate();
      return;
    }

    if (!backSpace)
      //Restaura o caractere que está em cima do cursor
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
    else {
      //Restaura o caractere em branco
      ws.send(
        JSON.stringify({
          type: "command",
          data: {
            curx: curx,
            cury: cury,
            str: " "
          }
        })
      );
      backSpace = false;
    }

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
      //curx++;

      ws.send(
        JSON.stringify({
          type: "command",
          data: {
            curx: --curx,
            cury: cury,
            str: " "
          }
        })
      );

      backSpace = true;

      charBelowCursor.char = " ";
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

    //Pega o caracter que o cursor está em cima para restaurar ele depois que ele sair de cima
    let auxCharBelowCursor = screen.get({ x: curx, y: cury });
    if (auxCharBelowCursor.char != cursorBlock)
      charBelowCursor = auxCharBelowCursor;

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

  if (message.type == "initialData") {
    for (let i = 0; i < message.data.length; i++) {
      let { x, y, obj } = message.data[i];
      let { char, attr } = obj;

      if (attr.color != 0) console.log(attr.color);

      screen.put(
        {
          x,
          y,
          dx: 0,
          attr: {
            // Both foreground and background must have the same color
            bgColor: 0,
            color: attr.color
          }
        },
        char
      );
    }

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
  ws.send(
    JSON.stringify({
      type: "command",
      data: {
        curx: curx,
        cury: cury,
        str: " "
      }
    })
  );
  setTimeout(function() {
    process.exit();
  }, 500);
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

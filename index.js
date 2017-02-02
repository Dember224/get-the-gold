
const STATE_NO_MOVE = 'state-no-move';
const STATE_PLACED_PALISADE = 'placed-palisade';

const BOARD_WIDTH = 8;
const BOARD_HEIGHT = 5;

const TILE_COUNT = BOARD_WIDTH * BOARD_HEIGHT;

const goldTiles = [
  {
    position: [0,3],
    value: 3
  },
  {
    position: [1,1],
    value: 4
  },
  {
    position: [1,5],
    value: 4
  },
  {
    position: [1,7],
    value: 5
  },
  {
    position: [3,0],
    value: 5
  },
  {
    position: [3,4],
    value: 6
  },
  {
    position: [4,2],
    value: 6
  },
  {
    position: [4,6],
    value: 7
  }
];

function getGameEngine() {
  const startingTiles = new Array(BOARD_HEIGHT);
  for(var i=0; i<BOARD_HEIGHT; i++) {
    startingTiles[i] = new Array(BOARD_WIDTH);
    for(var j=0; j<BOARD_WIDTH; j++) {
      startingTiles[i][j] = {};
    }
  }
  goldTiles.forEach(function(tile) {
    startingTiles[tile.position[0]][tile.position[1]] = {
      type: 'gold',
      value: tile.value
    };
  });

  // Tiles on the board are given a number and counted from left to right and
  // top to bottom. So the first two rows worth of numbers looks like this:

  // 0  1  2  3  4  5  6  7
  // 8  9  10 11 12 13 14 15

  // Palisades are represented by the squares they bridge. So the difference in
  // value between palisades is always either 1 or 8. If a tile modulo 8 is 7,
  // then it can only have a palisade to the bottom. If a tile is greater than
  // 39-8 (it is in the last row) then it only has a palisade to the right.
  const startingPalisades = {};
  for(var i=0; i<TILE_COUNT; i++) {
    if(i < (TILE_COUNT - BOARD_WIDTH)) {
      startingPalisades[i + '-' + (i+BOARD_WIDTH)] = 0;
    }
    if(i%8 != 7) {
      startingPalisades[i + '-' + (i+1)] = 0;
    }
  }

  // Server Game Logic
  var gameState = {
    players: {
      'player-1': {
        race: 'wizard',
        tokens: [11, 2, 1, 1, 1]
      },
      'player-2': {
        race: 'elf',
        tokens: [11, 2, 1, 1, 1]
      }
    },
    palisades: startingPalisades,
    tiles: startingTiles,
    currentPlayer: 'player-2',
    currentState: STATE_NO_MOVE
  };

  return {
    getGameState: function() {
      return gameState;
    },
    addToken(row, column, value) {
      gameState.tiles[row][column] = {
        type: 'army',
        player: gameState.currentPlayer,
        value: value
      };
      console.log('added token: ' + row);
    },
    placePalisade(palisadeId) {
      gameState.palisades[palisadeId] = 1;
      console.log('placed palisade' + palisadeId);

      const isValid = (row, column) => {
        return 0 <= row && row < BOARD_HEIGHT && 0 <= column && column < BOARD_WIDTH;
      };

      const tileId = (tile) => {
        return tile.row * BOARD_WIDTH + tile.column;
      };

      const getPalisadeId = (a, b) => {
        return Math.min(a,b) + '-' + Math.max(a,b);
      };

      const isValidPalisade = (row, column, potentialPalisade) => {
        const canReach = (a, b) => {
          const palisadeId = getPalisadeId(tileId(a), tileId(b));
          return palisadeId !== potentialPalisade && gameState.palisades[palisadeId] !== 1;
        };

        const reachableNeighbors = (row, column) => {
          return [
            {row:row-1, column:column},
            {row:row+1, column:column},
            {row:row, column:column-1},
            {row:row, column:column+1}
          ].filter(tile => isValid(tile.row, tile.column) &&
              canReach({row: row, column: column}, tile));
        };

        const visited = [];
        const potential = [{row:row, column:column}];
        while(visited.length < 4 && potential.length > 0) {
          const next = potential.pop();
          visited.push(next);
          const neighbors = reachableNeighbors(next.row, next.column);
          const valid = neighbors.filter(x => {
            matches = y => y.row === x.row && y.column === x.column;
            return !visited.some(matches) && !potential.some(matches)
          });
          valid.forEach(x => potential.push(x));
        }
        return visited.length >= 4;
      };

      // update the palisade list so that invalid palisades are set to -1
      // palisades are invalid if they would create a territory of size < 4
      for(var row=0; row<BOARD_HEIGHT; row++) {
        for(var column=0; column<BOARD_WIDTH; column++) {
          const tile = {row: row, column:column};

          if(isValid(row+1, column)) {
            const check = getPalisadeId(tileId(tile), tileId({row:row+1, column:column}));
            if(gameState.palisades[check] === 0 && (!isValidPalisade(row, column, check) || !isValidPalisade(row+1, column, check))) {
              gameState.palisades[check] = -1;
            }
          }

          if(isValid(row, column+1)) {
            const check = getPalisadeId(tileId(tile), tileId({row:row, column:column+1}));
            if(gameState.palisades[check] === 0 && (!isValidPalisade(row, column, check) || !isValidPalisade(row, column+1, check))) {
              gameState.palisades[check] = -1;
            }
          }
        }
      }
    }
  };
}

// REST API
function getApp(gameEngine) {
  const path = require('path');
  const express = require('express');
  const app = express();
  const expressWs = require('express-ws')(app);

  app.use(express.static('client/dist/static'));

  app.get('/', function(request, response) {
    response.sendFile(path.join(__dirname + '/client/dist/index.html'));
  });

  app.get('/gameState', function(request, response) {
    response.send(JSON.stringify(gameEngine.getGameState(1)));
  });

  const openChannels = [];
  app.ws('/communication', function(webSocket, request) {
    openChannels.push({
      webSocket: webSocket,
      user: request.user
    });

    webSocket.on('message', function(serializedMessage) {
      console.log("Handling: " + serializedMessage);
      const message = JSON.parse(serializedMessage);

      if(message.type === 'select-tile') {
        gameEngine.addToken(message.value.row, message.value.column, message.value.size);
      } else if(message.type === 'place-palisade') {
        gameEngine.placePalisade(message.value.palisadeId);
      }

      openChannels.forEach(function(channel) {channel.webSocket.send('reload-state');});

      console.log("Broadcast Message");
    });

    webSocket.send('test-connection');
  });

  app.listen(3000, function () {
    console.log('Running on port 3000!');
  });

  return app;
};

const gameEngine = getGameEngine();
getApp(gameEngine);

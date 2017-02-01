
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
    currentPlayer: 'player-1',
    currentState: STATE_NO_MOVE
  };

  function optionsForCurrentPlayer() {
    const player = gameState.players[gameState.currentPlayer];
    const options = {};
    if(gameState.currentState === STATE_NO_MOVE) {

    }
  }

  return {
    getGameState: function(id) {
      return gameState;
    }
  };
}

// REST API
function getApp(gameEngine) {
  const path = require('path');
  const express = require('express');
  const app = express();

  app.use(express.static('client/dist/static'));

  app.get('/', function(request, response) {
    response.sendFile(path.join(__dirname + '/client/dist/index.html'));
  });

  app.get('/gameState', function(request, response) {
    response.send(JSON.stringify(gameEngine.getGameState(1)));
  });

  app.get('/options', function(request, response) {

  });

  app.post('/token/:tile/:value', function(request, response) {
    const id = request.params.id;
  });

  app.post('/palisade/:a/:b', function(request, response) {
    const id = request.params.id;
  });

  app.listen(3000, function () {
    console.log('Running on port 3000!');
  });

  return app;
};

const gameEngine = getGameEngine();
getApp(gameEngine);

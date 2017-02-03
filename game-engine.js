const STATE_PROLOGUE = 'state-prologue';
const STATE_NO_MOVE = 'state-no-move';
const STATE_PLACED_PALISADE = 'state-placed-palisade';
const STATE_GAME_OVER = 'state-game-over';

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

const getReserveValues = (count) => {
  if(count == 2) {
    return [11, 2, 1, 1, 1];
  } else if(count == 3) {
    return [7, 2, 1, 1];
  } else if(count == 4) {
    return [5, 1, 1, 1];
  }
};

module.exports = function() {
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
  /*var gameState = {
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
    currentState: STATE_PROLOGUE
  };*/
  var gameState = {
    players: {},
    playerOrder: [],
    palisades: startingPalisades,
    tiles: startingTiles,
    currentPlayer: null,
    currentState: STATE_PROLOGUE,
    playerSetup: {
      availableRaces: ['mage', 'elf', 'orc', 'goblin']
    }
  };

  // Game is over when all tiles are filled in on the game board - so iterate
  // through each tile and determine if any of them are empty
  const isGameOver = function() {
    return !gameState.tiles.some((row) => {
      return row.some((tile) => {
        return tile.type === undefined;
      });
    });
  };

  const canReach = (a, b, potentialPalisade) => {
    const palisadeId = getPalisadeId(tileId(a), tileId(b));
    return palisadeId !== potentialPalisade && gameState.palisades[palisadeId] !== 1;
  };

  const reachableNeighbors = (row, column, potentialPalisade) => {
    return [
      {row:row-1, column:column},
      {row:row+1, column:column},
      {row:row, column:column-1},
      {row:row, column:column+1}
    ].filter(tile => isValid(tile.row, tile.column) &&
        canReach({row: row, column: column}, tile, potentialPalisade));
  };

  const isValid = (row, column) => {
    return 0 <= row && row < BOARD_HEIGHT && 0 <= column && column < BOARD_WIDTH;
  };

  const tileId = (tile) => {
    return tile.row * BOARD_WIDTH + tile.column;
  };

  const getPalisadeId = (a, b) => {
    return Math.min(a,b) + '-' + Math.max(a,b);
  };

  const updateForNextTurn = function() {
    const index = gameState.playerOrder.indexOf(gameState.currentPlayer);
    gameState.currentPlayer = gameState.playerOrder[(index + 1) % gameState.playerOrder.length];
    if(isGameOver()) {
      gameState.currentState = STATE_GAME_OVER;
    } else {
      gameState.currentState = STATE_NO_MOVE;
    }
    console.log('CurrentPlayer: ' + gameState.currentPlayer);
  };

  return {
    getGameState: function() {
      return gameState;
    },
    joinGame(username) {
      if(gameState.playerOrder.length == 4) {
        throw 'Unable to join game: Already 4 players';
      }
      gameState.players[username] = {
        race: '',
        tokens: [],
        ready: false
      };
      gameState.playerOrder.push(username);
    },
    signalReady(username) {
      gameState.players[username].ready = true;
      var count = 0;
      var ready = true;
      for(var player in gameState.players) {
        count ++;
        ready = ready && gameState.players[player].ready;
      }
      if(ready && count > 1) {
        gameState.currentState = STATE_NO_MOVE;
        gameState.currentPlayer = gameState.playerOrder[0];
        for(var player in gameState.players) {
          gameState.players[player].tokens = getReserveValues(count);
        }
      }
    },
    setRace(username, race) {
      gameState.players[username].race = race;
    },
    addToken(row, column, value) {
      const playerState = gameState.players[gameState.currentPlayer];
      if(playerState.tokens[value-1] === 0) {
        return;
      }
      playerState.tokens[value-1] --;
      gameState.tiles[row][column] = {
        type: 'army',
        player: gameState.currentPlayer,
        value: value
      };
      updateForNextTurn();
      console.log('added token: ' + row);
    },
    placePalisade(palisadeId) {
      gameState.palisades[palisadeId] = 1;
      if(gameState.currentState == STATE_PLACED_PALISADE) {
        updateForNextTurn();
      } else if(gameState.currentState == STATE_NO_MOVE) {
        gameState.currentState = STATE_PLACED_PALISADE;
      }

      console.log('placed palisade' + palisadeId);

      const isValidPalisade = (row, column, potentialPalisade) => {
        const visited = [];
        const potential = [{row:row, column:column}];
        while(visited.length < 4 && potential.length > 0) {
          const next = potential.pop();
          visited.push(next);
          const neighbors = reachableNeighbors(next.row, next.column, potentialPalisade);
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
};

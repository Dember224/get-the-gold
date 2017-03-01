const assert = require('assert');
const GameEngine = require('../game-engine.js');

function getGameEngine() {
  // by default we want to use a gauranteed setup for gold values
  return GameEngine(GameEngine.getInitialState({
    goldValues:[3,4,4,5,5,6,6,7]
  }));
}

function getSetupGameEngine() {
  const gameEngine = getGameEngine();
  gameEngine.joinGame('player-1'); gameEngine.joinGame('player-2');
  gameEngine.setRace('player-1', 'elf'); gameEngine.setRace('player-2', 'mage');
  gameEngine.signalReady('player-1');
  gameEngine.signalReady('player-2');
  return gameEngine;
}

function getGameEngineWithFourPlayers() {
  const gameEngine = getGameEngine();
  gameEngine.joinGame('player-1', 'player-one-id');
  gameEngine.joinGame('player-2', 'player-two-id');
  gameEngine.joinGame('player-3', 'player-three-id');
  gameEngine.joinGame('player-4', 'player-four-id');
  return gameEngine;
}

describe('GameEngine Public Functions', function() {
  describe('getGameState', function() {
    describe('without any setup', function() {
      const gameEngine = getGameEngine();
      it('should have no players', function() {
        assert.deepEqual({}, gameEngine.getGameState().players);
        assert.deepEqual([], gameEngine.getGameState().playerOrder);
      });
      it('should have null current player', function() {
        assert.deepEqual(null, gameEngine.getGameState().currentPlayer);
      });
      it('should be in prologue state', function() {
        assert.deepEqual('state-prologue', gameEngine.getGameState().currentState);
      });
      it('should have appropriate playerSetup', function() {
        assert.deepEqual({availableRaces: ['mage', 'elf', 'orc', 'goblin']}, gameEngine.getGameState().playerSetup);
      });
      it('should have completely empty data for palisades', function() {
        const palisadeKeys = Object.keys(gameEngine.getGameState().palisades);
        assert.equal(67, palisadeKeys.length);
        assert(palisadeKeys.every(key => gameEngine.getGameState().palisades[key] == 0));
      });
    });

    describe('when playing the game', function() {
      const gameEngine = getGameEngine();
      gameEngine.joinGame('player-1', 'player-one-id');
      gameEngine.joinGame('player-2', 'player-two-id');
      gameEngine.signalReady('player-1');
      gameEngine.signalReady('player-2');
      it('should hide player-1 token information from player-2', function() {
        assert.equal(undefined,gameEngine.getGameState('player-two-id').players['player-1'].tokens);
      });
      it('should hide player-2 token information from player-1', function() {
        assert.equal(undefined,gameEngine.getGameState('player-one-id').players['player-2'].tokens);
      });
      it('should not hide player-2 token information from player-2', function() {
        assert.deepEqual([11,2,1,1,1],gameEngine.getGameState('player-two-id').players['player-2'].tokens);
      });
      gameEngine.addToken(0,0,1);
      it('should show the correct tile information for player-1', function() {
        assert.deepEqual({
          type: 'army',
          player: 'player-1',
          value: 1
        }, gameEngine.getGameState('player-one-id').tiles[0][0]);
      });
      it('should hide the tile value for player-2', function() {
        assert.deepEqual({
          type: 'army',
          player: 'player-1'
        }, gameEngine.getGameState('player-two-id').tiles[0][0]);
      });
    });
  });

  describe('getPlayerNameForId', function() {
    it('should return player id if player exists', function() {
      const gameEngine = getGameEngine();
      gameEngine.joinGame('player-one', 'player-id');
      assert.equal('player-one', gameEngine.getPlayerNameForId('player-id'));
    });
    it('should return null if player does not exist', function() {
      const gameEngine = getGameEngine();
      assert.equal(null, gameEngine.getPlayerNameForId('player-id'));
    });
  });

  describe('joinGame', function() {
    describe('single player', function() {
      const gameEngine = getGameEngine();
      gameEngine.joinGame('player-1', 'player-one-id');
      it('should have player in gameState', function() {
        const players = {'player-1': {playerId: 'player-one-id', race: "", ready: false, tokens: []}};
        assert.deepEqual(players, gameEngine.getGameState().players);
        assert.deepEqual(['player-1'], gameEngine.getGameState().playerOrder);
      });
      it('should still be in prologue state', function() {
        assert.equal('state-prologue', gameEngine.getGameState().currentState);
      });
    });
    describe('multiple players', function() {
      const playerDataForFourPlayers = {
        'player-1': {race: "", ready: false, tokens: [], playerId: 'player-one-id'},
        'player-2': {race: "", ready: false, tokens: [], playerId: 'player-two-id'},
        'player-3': {race: "", ready: false, tokens: [], playerId: 'player-three-id'},
        'player-4': {race: "", ready: false, tokens: [], playerId: 'player-four-id'}
      };
      it('should allow four players to join', function() {
        const gameEngine = getGameEngineWithFourPlayers();
        assert.deepEqual(playerDataForFourPlayers, gameEngine.getGameState().players);
        assert.deepEqual(['player-1', 'player-2', 'player-3', 'player-4'], gameEngine.getGameState().playerOrder);
      });
      it('should still be in prologue state', function() {
        const gameEngine = getGameEngineWithFourPlayers();
        assert.equal('state-prologue', gameEngine.getGameState().currentState);
      });
      it('should not allow a fifth player to join', function() {
        const gameEngine = getGameEngineWithFourPlayers();
        assert.throws(() => gameEngine.joinGame('player-5'), 'Unable to join game: Already 4 players');
        assert.deepEqual(playerDataForFourPlayers, gameEngine.getGameState().players);
        assert.deepEqual(['player-1', 'player-2', 'player-3', 'player-4'], gameEngine.getGameState().playerOrder);
      });
    });
  });

  describe('setRace', function() {
    it('should set race within players dictionary', function() {
      const gameEngine = getGameEngine();
      gameEngine.joinGame('player-1', 'player-one-id');
      gameEngine.setRace('player-1', 'elf');
      const players = {'player-1': {playerId: 'player-one-id', race: "elf", ready: false, tokens: []}};
      assert.deepEqual(players, gameEngine.getGameState().players);
    });
  });

  describe('signalReady', function() {
    it('should not start game if only one player signals ready', function() {
      const gameEngine = getGameEngine();
      gameEngine.joinGame('player-1');
      gameEngine.setRace('player-1', 'elf');
      gameEngine.signalReady('player-1');
      assert.equal('state-prologue', gameEngine.getGameState().currentState);
    });
    it('should not start the game if there are two players and only one signals ready', function() {
      const gameEngine = getGameEngine();
      gameEngine.joinGame('player-1'); gameEngine.joinGame('player-2');
      gameEngine.setRace('player-1', 'elf'); gameEngine.setRace('player-2', 'mage');
      gameEngine.signalReady('player-1');
      assert.equal('state-prologue', gameEngine.getGameState().currentState);
    });
    describe('two players signal ready', function() {
      const gameEngine = getGameEngine();
      gameEngine.joinGame('player-1'); gameEngine.joinGame('player-2');
      gameEngine.setRace('player-1', 'elf'); gameEngine.setRace('player-2', 'mage');
      gameEngine.signalReady('player-1');
      gameEngine.signalReady('player-2');
      it('should start the game if two players signal ready', function() {
        assert.equal('state-no-move', gameEngine.getGameState().currentState);
      });
      it('should set the first player to join as player one', function() {
        assert.equal('player-1', gameEngine.getGameState().currentPlayer);
      });
      it('should assign the correct number of reserves for each player', function() {
        assert.deepEqual([11, 2, 1, 1, 1], gameEngine.getGameState().players['player-1'].tokens);
        assert.deepEqual([11, 2, 1, 1, 1], gameEngine.getGameState().players['player-2'].tokens)
      });
    });
  });

  describe('endTurn', function() {
    it('removes the current player from playerOrder, sets next player as current player', function() {
      const gameEngine = getSetupGameEngine();
      gameEngine.endTurn();
      assert.deepEqual(['player-2'], gameEngine.getGameState().playerOrder);
      assert.equal('player-2', gameEngine.getGameState().currentPlayer);
      assert.equal('state-no-move', gameEngine.getGameState().currentState);
    });
    it('once all players pass, current player is null and playerOrder is empty, and game is over', function() {
      const gameEngine = getSetupGameEngine();
      gameEngine.endTurn();
      gameEngine.endTurn();
      assert.deepEqual([], gameEngine.getGameState().playerOrder);
      assert.equal(null, gameEngine.getGameState().currentPlayer);
      assert.equal('state-game-over', gameEngine.getGameState().currentState);
    });
  });

  describe('addToken', function() {
    describe('adding token of value 1 in empty tile 0,0', function() {
      const gameEngine = getSetupGameEngine();
      gameEngine.addToken(0,0,1);
      it('should have the correct value in tiles[0][0]', function() {
        assert.deepEqual({type:'army', player:'player-1', value:1}, gameEngine.getGameState().tiles[0][0]);
      });
      it('should set gameState.currentPlayer to the next player in order', function() {
        assert.equal('player-2', gameEngine.getGameState().currentPlayer);
      });
      it('should set gameState.currentState to state-no-move', function() {
        assert.equal('state-no-move', gameEngine.getGameState().currentState);
      });
      it('should decrement the number of tokens for player-1 of value 1', function() {
        assert.deepEqual([10, 2, 1, 1, 1], gameEngine.getGameState().players['player-1'].tokens);
      });
    });
  });
});

describe('Game Engine private functions', function() {
  describe('__isGameOver', function() {
    it('game not over when first starting', function() {
      const gameEngine = getSetupGameEngine();
      assert(!gameEngine.__isGameOver());
    });
    it('game is over when all players have passed', function() {
      const gameEngine = getSetupGameEngine();
      gameEngine.endTurn();
      assert(!gameEngine.__isGameOver());
      gameEngine.endTurn();
      assert(gameEngine.__isGameOver());
    });
    it('game is over when all tiles _AND_ palisades have been used', function() {
      const gameEngine = getSetupGameEngine();

      // place all palisades
      const palisades = gameEngine.getGameState().palisades;
      const nextValidPalisade = () => Object.keys(palisades).find(id => palisades[id] == 0);
      let id;
      while(id = nextValidPalisade()) {
        gameEngine.placePalisade(id);
      }
      assert(!gameEngine.__isGameOver());

      // place all tiles
      const gameState = gameEngine.getGameState();
      const nextValidArmySize = () => {
        return gameState.players[gameState.currentPlayer].tokens
          .findIndex(x => x > 0) + 1
      };
      for(let row=0; row<GameEngine.__BOARD_HEIGHT; row++) {
        for(let column=0; column<GameEngine.__BOARD_WIDTH; column++) {
          const next = nextValidArmySize();
          gameEngine.addToken(row, column, next);
        }
      }
      assert(gameEngine.__isGameOver());
    });
  });

  describe('__getReachableNeighbors', function() {
    it('should return only valid tiles - nothing out of bounds', function() {
      const gameEngine = getGameEngine();
      assert.deepEqual([
        {row:1,column:0},
        {row:0,column:1}
      ], gameEngine.__getReachableNeighbors(0,0));
    });
    it('should respect a potential palisade - ignore the tile on the other side of it', function() {
      const gameEngine = getGameEngine();
      assert.deepEqual([
        {row:1, column:0}
      ], gameEngine.__getReachableNeighbors(0,0,'0-1'));
    });
    it('should respect placed palisades - ignore the tile on the other side of it', function() {
      const gameEngine = getGameEngine();
      gameEngine.placePalisade('0-1');assert.deepEqual([
        {row:1, column:0}
      ], gameEngine.__getReachableNeighbors(0,0));
    });
  });

  describe('__getTerritoryTiles', function() {
    it('should return the tiles that are within the territory, sequestered by the palisades', function() {
      const gameEngine = getSetupGameEngine();

      gameEngine.placePalisade('1-2');
      gameEngine.placePalisade('8-16');
      gameEngine.placePalisade('9-10');
      gameEngine.placePalisade('9-17');

      assert.deepEqual([
        {row:1, column:1},
        {row:1, column:0},
        {row:0, column:0},
        {row:0, column:1}
      ], gameEngine.__getTerritoryTiles(1,1));
    });
  });

  // 0:W1    1:B1    1-2: |
  // 8:W1    9:G     9-10:|
  // 8-16:-- 9-17:--
  describe('__getGoldWinnersForTile', function() {
    it('should return player-1 when player-1 has more armies in the territory', function() {
      const gameEngine = getSetupGameEngine();

      gameEngine.addToken(0,0,1); // player-1
      gameEngine.addToken(0,1,1); // player-2
      gameEngine.addToken(1,0,1); // player-1
      gameEngine.placePalisade('1-2');
      gameEngine.placePalisade('8-16');
      gameEngine.placePalisade('9-10');
      gameEngine.placePalisade('9-17');

      assert.deepEqual(['player-1'], gameEngine.__getGoldWinnersForTile(1,1));
    });
    it('should return player-1 and player-2 when they have the same value in the territory', function() {
      const gameEngine = getSetupGameEngine();

      gameEngine.addToken(0,0,1); // player-1
      gameEngine.addToken(0,1,2); // player-2
      gameEngine.addToken(1,0,1); // player-1
      gameEngine.placePalisade('1-2');
      gameEngine.placePalisade('8-16');
      gameEngine.placePalisade('9-10');
      gameEngine.placePalisade('9-17');

      assert.deepEqual(['player-1', 'player-2'], gameEngine.__getGoldWinnersForTile(1,1));
    });
  });

  describe('__getPlayerScores', function() {
    it('should return player-1 as having the full value of a territory if they have more', function() {
      const gameEngine = getSetupGameEngine();

      gameEngine.addToken(0,0,1); // player-1
      gameEngine.addToken(0,1,1); // player-2
      gameEngine.addToken(1,0,1); // player-1
      gameEngine.placePalisade('1-2');
      gameEngine.placePalisade('8-16');
      gameEngine.placePalisade('9-10');
      gameEngine.placePalisade('9-17');

      assert.deepEqual({'player-1': 4}, gameEngine.__getPlayerScores());
    });
    it('should return both players as having 2 when they have the same army size in a territory', function() {
      const gameEngine = getSetupGameEngine();

      gameEngine.addToken(0,0,1); // player-1
      gameEngine.addToken(0,1,2); // player-2
      gameEngine.addToken(1,0,1); // player-1
      gameEngine.placePalisade('1-2');
      gameEngine.placePalisade('8-16');
      gameEngine.placePalisade('9-10');
      gameEngine.placePalisade('9-17');

      assert.deepEqual({'player-1': 2, 'player-2': 2}, gameEngine.__getPlayerScores());
    });
  });

  describe('__determineWinner', function() {
    it('should return player-1 when they have the most points', function() {
      const gameEngine = getSetupGameEngine();

      gameEngine.addToken(0,0,1); // player-1
      gameEngine.addToken(0,1,1); // player-2
      gameEngine.addToken(1,0,1); // player-1
      gameEngine.placePalisade('1-2');
      gameEngine.placePalisade('8-16');
      gameEngine.placePalisade('9-10');
      gameEngine.placePalisade('9-17');

      assert.equal('player-1', gameEngine.__determineWinner());
    });
  });
});

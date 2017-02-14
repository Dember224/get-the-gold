
// REST API
function getApp(gameStates, gameEngines) {
  const path = require('path');
  const express = require('express');
  const app = express();
  const expressWs = require('express-ws')(app);

  const uuid = require('uuid');

  app.use(express.static('client/dist/static'));
  app.use(require('cookie-parser')());
  app.use(require('body-parser').urlencoded({ extended: true }));
  app.use(require('express-session')({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));

  app.get('/', function(request, response, next) {
    const newGameId = uuid();
    gameStates.storeState(newGameId, gameEngines.getInitialState(), function(e) {
      if(e) { return next(e); }
      response.redirect('/game/' + newGameId);
      next();
    });
  });

  app.get('/gameState', function(request, response, next) {
    const gameId = request.cookies.gameId;
    gameStates.getState(gameId, function(e, one) {
      if(e) { next(e); }
      response.send(JSON.stringify(one));
      next();
    });
  });

  app.get('/game/:gameId', function(request, response, next) {
    const gameId = request.params.gameId;
    gameStates.getState(gameId, function(e, one) {
      if(e) { next(e); }
      response.cookie('gameId',gameId);
      response.sendFile(path.join(__dirname + '/client/dist/index.html'));

    });
  });

  app.ws('/communication', function(webSocket, request) {
    const gameId = request.cookies.gameId;
    webSocket.gameId = gameId;
    webSocket.on('message', function(serializedMessage) {
      console.log("Handling: " + serializedMessage);
      const message = JSON.parse(serializedMessage);

      const gameState = gameStates.getState(gameId, function(error, gameState) {
        const gameEngine = gameEngines(gameState)

        if(message.type === 'select-tile') {
          gameEngine.addToken(message.value.row, message.value.column, message.value.size);
        } else if(message.type === 'place-palisade') {
          gameEngine.placePalisade(message.value.palisadeId);
        } else if(message.type === 'join-game') {
          gameEngine.joinGame(message.value.username);
        } else if(message.type === 'set-race') {
          gameEngine.setRace(message.value.username, message.value.race);
        } else if(message.type === 'signal-ready') {
          gameEngine.signalReady(message.value.username);
        }

        gameStates.storeState(gameId, gameState, function() {
          expressWs.getWss().clients.forEach(function(client) {
            if(client.gameId === gameId) {
              client.send('reload-state');
            }
          });
          console.log("Broadcast Message");
        });
      });
    });

    webSocket.send('test-connection');
  });

  app.listen(3000, function () {
    console.log('Running on port 3000!');
  });

  return app;
};

const gameStates = require('./game-state.js')();
const gameEngine = require('./game-engine.js');
getApp(gameStates, gameEngine);

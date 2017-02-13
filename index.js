
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

  var openChannels = [];
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
      } else if(message.type === 'join-game') {
        gameEngine.joinGame(message.value.username);
      } else if(message.type === 'set-race') {
        gameEngine.setRace(message.value.username, message.value.race);
      } else if(message.type === 'signal-ready') {
        gameEngine.signalReady(message.value.username);
      }

      openChannels.forEach(function(channel) {
        channel.webSocket.send('reload-state');
      });

      console.log("Broadcast Message");
    });

    webSocket.send('test-connection');
  });

  app.listen(3000, function () {
    console.log('Running on port 3000!');
  });

  return app;
};

const gameEngine = require('./game-engine.js');
getApp(gameEngine(gameEngine.getInitialState()));

const assert = require('assert');
const async = require('async');
const createGameState = require('../game-state.js');

const MongoClient = require('mongodb').MongoClient;
const testUrl = 'mongodb://localhost:27017/test'

const mongo = function(callback) {
  MongoClient.connect(testUrl, function(e, db) {
    if(e) { callback(e); }
    else {
      callback(null, db);
      db.close();
    }
  });
};

describe('interactions with the game state object', function() {
  const gameState = createGameState(mongo);
  it('saving game state should store it into mongo db', function(done) {
    async.waterfall([
      function(cb) {
        gameState.storeState(null, {test:1}, cb)
      },
      function(id, cb) {
        mongo(function(err, db) {
          db.collection('game-state').findOne({_id: id}, function(e, object) {
            if(e) { callback(e); }
            assert.deepEqual({test:1, _id: id}, object);
            done();
          });
        });
      }
    ], function(err, result) {});
  });
});

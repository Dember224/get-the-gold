module.exports = function(mongo) {
  return {
    storeState: function(id, gameState, callback) {
      mongo(function(err, db) {
        if(err) { callback(err); }
        db.collection('game-state').insertOne(gameState, function(err, result) {
          if(err) { callback(err); }
          callback(null, result.insertedId);
        });
      });
    },
    getState: function(id, callback) {
      mongo(function(err, db) {
        if(err) { callback(err); }
        const cursor = db.collection('game-state').findOne({_id: id}, function(e, one) {
          if(e) { callback(e); }
          callback(null, one);
        });
      });
    }
  };
};

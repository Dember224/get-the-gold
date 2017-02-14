module.exports = function() {
  const db = new (require('jfs'))('data/game-state');
  return {
    storeState: function(id, gameState, callback) {
      db.save(id, gameState, callback);
    },
    getState: function(id, callback) {
      db.get(id, callback);
    }
  };
};

const React = require('react');
const ReactDom = require('react-dom');

const colorMap = {
  elf: 'blue',
  mage: 'white',
  orc: 'red',
  goblin: 'black'
};

const TILE_HEIGHT = 102;
const TILE_WIDTH = 102;

const Reserves = React.createClass({
  render: function() {
    const gameState = this.props.gameState;
    const clientState = this.props.clientState;
    const playerState = gameState.players[clientState.username];
    const playerRace = playerState.race;
    const color = colorMap[playerRace];

    const tokens = playerState.tokens.map((count, value) => {
      const tokenStyle = {
        left: 10 + value*150
      };
      const armyClassName = clientState.selectedTokenSize === value+1 ? "army selected" : "army";
      const armyStyle = {
        backgroundColor: color
      };
      const selectValue = () => { this.props.selectToken(value+1); };
      return (<div className="unused-token" style={tokenStyle}>
        <div className={armyClassName} style={armyStyle} onClick={selectValue}>
          <p>{value+1}</p>
        </div>
        <div className="army-count">x{count}</div>
      </div>);
    });

    return <div className="player-area">{tokens}</div>;
  }
});

const GameBoard = React.createClass({
  render: function() {
    const gameState = this.props.gameState;

    const currentRace = gameState.players[gameState.currentPlayer].race;
    const unplacedArmyColor = colorMap[currentRace];

    const isCurrentPlayer = this.props.clientState.username == gameState.currentPlayer;

    const rows = gameState.tiles.map((tiles, row) => {
      const elements = tiles.map((tile, column) => {
        const style = {
          top: TILE_HEIGHT * row,
          left: TILE_WIDTH * column
        };

        var contents = "";
        if(tile.type === 'gold') {
          contents = (<div className='gold'>{tile.value}</div>);
        } else if(tile.type === 'army') {
          const tileRace = gameState.players[tile.player].race;
          const tileColor = colorMap[tileRace];
          const armyStyle = {
            backgroundColor: tileColor
          };
          if(tile.player === this.props.clientState.username) {
            contents = (<div className="army" style={armyStyle}>
              <p>{tile.value}</p>
            </div>);
          } else {
            contents = <div className="army" style={armyStyle}/>;
          }
        } else if(isCurrentPlayer && gameState.currentState == 'state-no-move') {
          const armyStyle = {
            backgroundColor: unplacedArmyColor
          };
          contents = <div className="army unplaced" style={armyStyle}/>;
        }

        const clickTile = isCurrentPlayer ?
          () => { this.props.selectTile(row, column); } : () => {} ;
        return <div onClick={clickTile} className='tile' style={style}>{contents}</div>;
      });
      return <div className='tileRow'>{elements}</div>;
    });

    const palisades = gameState.palisades;
    const palisadeDivs = gameState.tiles.map((tiles, row) => {
      return tiles.map((tile, column) => {
        const id = row * tiles.length + column;

        const getPalisade = (id, directionClassName, topOffset, leftOffset) => {
          if(palisades[id] === undefined) {
            return '';
          }

          const style = {
            top: TILE_HEIGHT * row + topOffset,
            left: TILE_WIDTH * column + leftOffset
          };

          if(palisades[id] === 1) {
            const className = 'palisade ' + directionClassName;
            return <div className={className} style={style}/>
          } else if(palisades[id] === 0 && isCurrentPlayer) {
            const className = 'palisade  unplaced ' + directionClassName;
            const place = () => { this.props.placePalisade(id); };
            return <div className={className} style={style} onClick={place}/>
          } else {
            return '';
          }
        };

        const rightPalisade = getPalisade(id + '-' + (id+1), 'vertical', 6, 96);
        const bottomPalisade = getPalisade(id + '-' + (id+8), 'horizontal', 96, 6);

        return <div>{rightPalisade, bottomPalisade}</div>;
      });
    });

    return <div className='board'>{rows}{palisadeDivs}</div>;
  }
});

function getFromServer(url) {
  const request = new XMLHttpRequest();
  request.open("GET", url, false);
  request.send(null);
  let result = JSON.parse(request.responseText);
  return result;
}

const GameState = React.createClass({
  render: function() {
    const gameState = this.props.gameState;
    const clientState = this.props.clientState;
    const endTurnButton = clientState.username != gameState.currentPlayer ? '' :
        (<button onClick={this.props.endTurn}>End Turn</button>);
    return (<div>
      Current Player: {gameState.currentPlayer}
      {endTurnButton}
    </div>);
  }
});

const PlayerSetup = React.createClass({
  getInitialState: function() {
    return {
      playerName: ''
    };
  },
  setName: function(event) {
    this.setState({
      playerName: event.target.value
    });
  },
  isNameValid: function() {
    return this.state.playerName != '' && this.state.playerName != null;
  },
  joinGame: function() {
    this.props.joinGameAsPlayer(this.state.playerName);
  },
  render: function() {
    const gameState = this.props.gameState;
    const clientState = this.props.clientState;

    if(clientState.username == null) {
      const joinButton =  this.isNameValid() ? <button onClick={this.joinGame}>Join</button> : <div/>;
      return (<div>
        <label htmlFor='name'>Player Name</label>
        <input name='name' value={this.state.playerName} onChange={this.setName}/>
        {joinButton}
      </div>);
    }

    const usedRaces = {};
    for(var username in gameState.players) {
      usedRaces[gameState.players[username].race] = username;
    }

    const playerRace = gameState.players[clientState.username].race;
    const raceSelectors = gameState.playerSetup.availableRaces.map(race => {
      const tokenStyle = {
        backgroundColor: colorMap[race]
      };
      var className = 'race-selector';
      if(playerRace === race) {
        className += ' selected'
      }
      const onClickFn = usedRaces[race] ? null : () => this.props.setRace(race);
      const text = usedRaces[race] && usedRaces[race] != clientState.username ? race + '[' + usedRaces[race] + ']' : race;
      return (<div onClick={onClickFn} className={className} key={race}>
        <div className='army' style={tokenStyle}/>
        <p>{text}</p>
      </div>);
    });

    const readyButton = playerRace ? <button onClick={this.props.signalReady}>Ready</button> : '';

    return (<div>
      <div>Name: {clientState.username}</div>
      {raceSelectors}
      {readyButton}
    </div>);
  }
});

function getGameState() {
  console.log('getGameState');
  return getFromServer('/gameState');
}

const GetTheGold = React.createClass({
  getInitialState: function() {
    this.props.webSocket.onmessage = (event) => {
      console.log('Reload');
      this.setState({
        gameState: getGameState()
      });
    };
    return {
      clientState: {
        selectedTokenSize: 1
      },
      gameState: getGameState()
    }
  },
  render: function() {
    const gameState = this.state.gameState;
    const clientState = this.state.clientState;
    const sendMessage = (type, value) => {
      this.props.webSocket.send(JSON.stringify({
        type: type,
        value: value
      }));
    };

    const signalReady = () => {
      sendMessage('signal-ready', {username: this.state.clientState.username});
    };

    if(gameState.currentState === 'state-prologue') {
      const joinGameAsPlayer = (username) => {
        sendMessage('join-game', {username: username});
        clientState.username = username;
        this.setState({
          clientState: clientState
        });
      };
      const setRace = (race) => {
        sendMessage('set-race', {username: clientState.username, race: race});
      };
      return <PlayerSetup gameState={gameState} clientState={clientState}
          joinGameAsPlayer={joinGameAsPlayer} setRace={setRace} signalReady={signalReady}/>;
    }

    const selectToken = (newToken) => {
      this.state.clientState.selectedTokenSize = newToken;
      this.setState(this.state);
    };

    const selectTile = (row, column) => {
      const value = {
        row: row,
        column: column,
        size: this.state.clientState.selectedTokenSize
      };
      sendMessage('select-tile', value);
    };

    const placePalisade = (palisadeId) => {
      const value = {
        palisadeId: palisadeId
      };
      sendMessage('place-palisade', value);
    };

    const endTurn = () => {
      sendMessage('end-turn');
    }

    return (<div>
      <GameState gameState={gameState} clientState={clientState} endTurn={endTurn}/>
      <GameBoard gameState={gameState} clientState={clientState}
          selectTile={selectTile} placePalisade={placePalisade}/>
      <Reserves gameState={gameState} clientState={clientState} selectToken={selectToken}/>
    </div>);
  }
});

const webSocket = new WebSocket("ws://localhost:3000/communication");
webSocket.onopen = (event) => {
  console.log("Open");
  ReactDom.render(<GetTheGold webSocket={webSocket}/>, document.getElementById('content'));
};

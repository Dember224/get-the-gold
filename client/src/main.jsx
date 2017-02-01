const React = require('react');
const ReactDom = require('react-dom');

const colorMap = {
  elf: 'blue',
  wizard: 'white'
};

const TILE_HEIGHT = 102;
const TILE_WIDTH = 102;

const Reserves = React.createClass({
  render: function() {
    const gameState = this.props.gameState;
    const clientState = this.props.clientState;
    const playerState = gameState.players[gameState.currentPlayer];
    const playerRace = playerState.race;
    const color = colorMap[playerRace];

    const tokens = playerState.tokens.map(function(count, value) {
      const tokenStyle = {
        left: 10 + value*150
      };
      const armyClassName = clientState.selectedTokenSize === value+1 ? "army selected" : "army";
      const armyStyle = {
        backgroundColor: color
      };
      return (<div className="unused-token" style={tokenStyle}>
        <div className={armyClassName} style={armyStyle}><p>{value+1}</p></div>
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

    const rows = gameState.tiles.map(function(tiles, row) {
      const elements = tiles.map(function(tile, column) {
        const style = {
          top: TILE_HEIGHT * row,
          left: TILE_WIDTH * column
        };

        var contents = "";
        if(tile.type === 'gold') {
          contents = (<div className='gold'>{tile.value}</div>);
        } else {
          const armyStyle = {
            backgroundColor: unplacedArmyColor
          };
          contents = <div className="army unplaced" style={armyStyle}/>;
        }

        return <div className='tile' style={style}>{contents}</div>;
      });
      return <div className='tileRow'>{elements}</div>;
    });

    const palisades = gameState.palisades;
    const palisadeDivs = gameState.tiles.map(function(tiles, row) {
      return tiles.map(function(tile, column) {
        const id = row * tiles.length + column;

        const idRight = id + '-' + (id+1);
        var rightPalisade = '';
        if(palisades[idRight] != undefined) {
          const rightPalisadeStyle = {
            top: TILE_HEIGHT * row + 6,
            left: TILE_WIDTH * column + 98
          };
          rightPalisade = <div className='palisade unplaced vertical' style={rightPalisadeStyle}/>;
        }

        var bottomPalisade = '';
        const idBottom = id + '-' + (id+8);
        if(palisades[idBottom] != undefined) {
          const bottomPalisadeStyle = {
            top: TILE_HEIGHT * row + 98,
            left: TILE_WIDTH * column + 6
          };
          bottomPalisade = <div className='palisade unplaced horizontal' style={bottomPalisadeStyle}/>;
        }

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

function getGameState() {
  return getFromServer('gameState');
}

const clientState = {
  selectedTokenSize: 1
};
const GetTheGold = React.createClass({
  render: function() {
    const gameState = getGameState();
    return (<div>
      <GameBoard gameState={gameState} clientState={clientState}/>
      <Reserves gameState={gameState} clientState={clientState}/>
    </div>);
  }
});

const webSocket = new WebSocket("ws://localhost:3000/communication");
webSocket.onmessage = (event) => {
   console.log("Received Message");
};
webSocket.onopen = (event) => {
  console.log("Open");
  ReactDom.render(<GetTheGold/>, document.getElementById('content'));
};

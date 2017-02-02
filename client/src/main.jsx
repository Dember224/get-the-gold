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
          contents = <div className="army" style={armyStyle}/>;
        } else {
          const armyStyle = {
            backgroundColor: unplacedArmyColor
          };
          contents = <div className="army unplaced" style={armyStyle}/>;
        }

        const clickTile = () => { this.props.selectTile(row, column); };
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
          } else if(palisades[id] === 0) {
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

function getGameState() {
  console.log('getGameState');
  return getFromServer('gameState');
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
    const selectToken = (newToken) => {
      this.state.clientState.selectedTokenSize = newToken;
      this.setState(this.state);
    };
    const sendMessage = (type, value) => {
      this.props.webSocket.send(JSON.stringify({
        type: type,
        value: value
      }));
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

    return (<div>
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

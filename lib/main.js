
import {LitElement, html, css, svg} from 'lit-element';
import {styleMap} from 'lit-html/directives/style-map';
import './hex-grid';

import {validCoords} from './hex-grid';

let PLAYER_COLOR_MAP = {
  'blue': {
    highlightColor: 'cornflowerblue',
    hexColor: 'rgb(50,50,150)',
    edgeColor: 'blue',
  },
  'red': {
    highlightColor: 'lightcoral',
    hexColor: 'darkred',
    edgeColor: 'red',
  },
  'dead': {
    highlightColor: 'black',
    hexColor: 'rgb(30,30,30)',
    edgeColor: 'black',
  },
};

const GRID_NS = 5;

export class HexaSlimeGame extends LitElement {

  static get styles() {
    return css`
      :host {
        display: flex;
        background: darkslategray;
      }

      hex-grid {
        margin-top: 20pt;
        flex: 1;
      }

      #info {
        display: flex;
        width: 60pt;
        flex-direction: column;
        padding: 10pt;
        margin: 10pt;
        background: white;
        border-radius: 5pt;
        box-shadow: 0 0 16pt 0 rgba(0,0,0,0.8);
      }

      .player-info {
        display: flex;
        justify-content: center;
        transition: opacity 0.2s, box-shadow 0.2s;
        box-shadow: none;
        opacity: 0.5;
        padding: 10pt 20pt;
        color: white;
        font-size: 15pt;
        border-radius: 5pt;
      }

      .player-info + .player-info {
        margin-top: 5pt;
      }

      .player-info.active {
        box-shadow: 0 2pt 4pt 0 rgba(0,0,0,0.5);
        opacity: 1;
      }

      .edge-bubble {
        display: flex;
        justify-content: center;
        align-items: center;
        flex-shrink: 0;
        width: 35pt;
        height: 35pt;
        border-radius: 100pt;
        box-sizing: border-box;
        transition: border 0.2s;
        border: none;
      }

      .player-info.active .edge-bubble.active {
        border: 2pt solid white;
      }
    `;
  }

  static get properties() {
    return {
      hoverId: {type: String},
      players: {type: Array},
      currentPlayerIndex: {type: Number},
      clientIsPlayer: {type: Boolean},
    };
  }
  
  constructor() {
    super();
    this.restart();
  }

  get currentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  restart() {
    let {hexGrid, players = []} = this;
    this.elementDataMap = new Map();
    for (let coord of validCoords(GRID_NS)) {
      this.elementDataMap.set(JSON.stringify(coord), {});
    }

    this.playerData = players.map(() => ({ edgeCount: 0 }));
    this.requestUpdate();
  }

  getElementsForPlayer(target) {
    return Array.from(this.elementDataMap.entries())
      .filter(([id, entry]) => entry.player == target)
      .map(([id, entry]) => id);
  }

  get currentPlayerData() {
    return this.playerData[this.currentPlayerIndex];
  }

  floodConnected(id) {
    let {hexGrid} = this;
    let result = new Set([id]);
    let visit = [id];

    while (visit.length) {
      let next = [];
      
      if (hexGrid.isHexId(id)) {

      } else if (hexGrid.isEdgeId(id)) {

      }

      visit = next;
    }

    return result;
  }

  nextTurn() {
    this.currentPlayerData.usingEdge = false;
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    this.currentPlayerData.edgeCount += 1;
  }

  getClickableEdgeIds() {
    if (!this.clientIsPlayer) return [];
    let {hexGrid} = this;
    
    let elements = this.getElementsForPlayer(this.currentPlayer).map(x => hexGrid.idToCoord(x));
    let hexes = elements.filter(x => x.length == 2);
    let edges = elements.filter(x => x.length == 3);

    return [
        ...hexes.flatMap(x => hexGrid.hexAdjacentEdges(x)),
        ...edges.flatMap(x => hexGrid.halfedgesAdjacentEdges(x)),
      ].map(x => hexGrid.coordToId(x))
      .filter(id => {
        let elementData = this.elementDataMap.get(id);
        if (!elementData) return false;
        return !elementData.player;
      });
  }

  get hexGrid() {
    return this.shadowRoot.querySelector('hex-grid');
  }

  onTileClick(e) {
    if (!this.clientIsPlayer) return;
    let {id, tileType} = e.detail;
    let data = this.elementDataMap.get(id);
    if (tileType == 'edge' && !(new Set(this.getClickableEdgeIds())).has(e.detail.id)) return;
    if (tileType == 'hex' && (data.player || this.currentPlayerData.usingEdge)) return;

    data.player = this.currentPlayer;
    if (e.detail.tileType == 'hex') {
      this.nextTurn();
    } else if (e.detail.tileType == 'edge') {
      this.currentPlayerData.edgeCount--;
      this.currentPlayerData.usingEdge = true;
      if (this.currentPlayerData.edgeCount <= 0) this.nextTurn();
    }
    this.requestUpdate();
  }

  setHoverId(newId) {
    this.hoverId = null;
    if (this.clientIsPlayer) {
      this.hoverId = newId;
    }
  }

  onTileMouseOver(e) {
    let {id, coord, tileType} = e.detail;
    if (tileType == 'hex' && this.currentPlayerData.usingEdge) return;
    this.setHoverId(id);
  }

  onTileMouseOut(e) {
    this.setHoverId(null);
  }

  renderElementStyles() {
    let elementStyles = new Map();

    let {hexGrid} = this;
    if (!hexGrid) return elementStyles;

    let {elementDataMap} = this;

    function isFilledCorner(coord) {
      let adjacent = hexGrid.cornerAdjacentEdges(coord)
        .map(x => (elementDataMap.get(hexGrid.coordToId(x)) || {}).player)
        .filter(x => x);
      if (adjacent.length < 2) return;
      if (adjacent[0] == adjacent[1]) return adjacent[0];
      if (adjacent[1] == adjacent[2]) return adjacent[1];
      if (adjacent[2] == adjacent[0]) return adjacent[2];
    }

    let clickableEdges = new Set(this.getClickableEdgeIds());
    for (let coord of hexGrid.validCoords) {
      let id = hexGrid.coordToId(coord);

      let style = {
      };

      if (id == this.hoverId && this.currentPlayer) {
        style.fill = PLAYER_COLOR_MAP[this.currentPlayer].highlightColor;
        style.stroke = PLAYER_COLOR_MAP[this.currentPlayer].highlightColor;
      }

      if (hexGrid.isEdgeId(id) && !clickableEdges.has(id)) {
        delete style.fill;
        delete style.stroke;
      }

      let elementPlayer = this.elementDataMap.get(id).player;
      if (elementPlayer) {
        style.fill = PLAYER_COLOR_MAP[elementPlayer].hexColor;
        style.stroke = PLAYER_COLOR_MAP[elementPlayer].edgeColor;
      }

      elementStyles.set(id, style);
    }

    for (let id of hexGrid.validCornerIds) {
      let coord = hexGrid.idToCoord(id);
      let elementPlayer = isFilledCorner(coord);
      if (elementPlayer) {
        let style = {};
        style.fill = PLAYER_COLOR_MAP[elementPlayer].edgeColor;
        elementStyles.set(id, style);
      }
    }

    return elementStyles;
  }

  renderPlayerData(data, i) {
    let playerColors = PLAYER_COLOR_MAP[this.players[i]];
    let divStyle = {
      'background': playerColors.edgeColor,
    };

    const activeClass = i === this.currentPlayerIndex ? 'active' : '';
    const edgeClass = this.currentPlayerData.usingEdge ? 'active' : ''; 
    return html`
      <div class="player-info ${activeClass}" style="${styleMap(divStyle)}">
        <div class="edge-bubble ${edgeClass}">${data.edgeCount}</div>
      </div>
    `;
  }

  render() {
    let elementStyles = this.renderElementStyles();
    return html`
      <div id="info">
        ${this.playerData.map(this.renderPlayerData.bind(this))}
      </div>
      <hex-grid ns=${GRID_NS} r=5 margin=1 .elementStyles=${elementStyles}
          @tile-click=${this.onTileClick}
          @tile-mouseover=${this.onTileMouseOver}
          @tile-mouseout=${this.onTileMouseOut}
        ></hex-grid>
    `;
  }
}

customElements.define('hexa-slime-game', HexaSlimeGame);



import {LitElement, html, css, svg} from 'lit-element';
import {styleMap} from 'lit-html/directives/style-map';
import {hexCenterXFunction, hexCenterYFunction} from './hex-grid';

import {validCoords} from './hex-grid';

export const PLAYER_COLOR_MAP = {
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
const GRID_R = 5;
const GRID_MARGIN = 1;

export class HexaSlimeGame extends LitElement {

  static get styles() {
    return css`
      :host {
        display: flex;
        background: darkslategray;
      }

      hex-grid {
        background: darkslategray;
      }

      #frame, hex-grid {
        height: 100vh;
        width: 100vh;
        position: relative;
      }

      #info {
        display: flex;
        width: 75pt;
        flex-direction: column;
        padding: 10pt;
        margin: 10pt;
        background: white;
        border-radius: 5pt;
        box-shadow: 0 0 10pt 0 rgba(0,0,0,0.8);
        position: sticky;
        left: 0;
        z-index: 1000;
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

      @keyframes flash {
        0% {opacity: 0}
        50% {opacity: 1}
        100% {opacity: 0}
      }

      .player-info.active .edge-bubble.active {
        border: 2pt solid white;
        animation: flash 1s infinite;
      }

      .heading {
        margin-bottom: 10pt; 
      }

      #wrapper {
        display: flex;
        justify-content: center;
        flex: 1;
      }

      .health-indicator {
        display: flex;
        font-size: 10pt;
        justify-content: center;
        align-items: center;
        background: white;
        position: absolute;
        border-radius: 20pt;
        width: 20pt;
        height: 20pt;
        z-index: 100;
        box-shadow: 0 2pt 4pt 0 rgba(0,0,0,0.5);
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
    this.turn = 0;
    this.elementDataMap = new Map();
    for (let coord of validCoords(GRID_NS)) {
      this.elementDataMap.set(JSON.stringify(coord), { health: 0 });
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

  getElementData(id) {
    return this.elementDataMap.get(id) || {};
  }

  floodConnected(id) {
    let {hexGrid} = this;
    let result = new Set();
    let visit = [id];

    let elementData = this.getElementData(id);
    if (!elementData.player || elementData.player == 'dead') return result;

    while (visit.length) {
      let next = [];
      
      for (let visitId of visit) {
        if (this.getElementData(visitId).player != elementData.player) continue;
        if (result.has(visitId)) continue;
        result.add(visitId);

        let coord = hexGrid.idToCoord(visitId);
        if (hexGrid.isHexId(visitId)) {
          let adjacentEdges = hexGrid.hexAdjacentEdges(coord);
          for (let i = 0; i < adjacentEdges.length; i++) {
            let adjacent = adjacentEdges[i];
            next.push(adjacent);

            let adjacentId = hexGrid.coordToId(adjacent);
            if (!this.getElementData(adjacentId).player) {
              next.push(hexGrid.hexAdjacentHexInDirection(coord, i));
            }
          }
        } else if (hexGrid.isEdgeId(visitId)) {
          for (let adjacent of hexGrid.halfedgesAdjacentEdges(coord)) {
            next.push(adjacent);
          }
          for (let adjacent of hexGrid.edgeAdjacentHexes(coord)) {
            next.push(adjacent);
          }
        }
      }

      visit = next.map(x => hexGrid.coordToId(x));
    }

    return result;
  }

  checkGameOver() {
    let {hexGrid} = this;
    let hexData = hexGrid.validHexCoords.map(coord => this.elementDataMap.get(hexGrid.coordToId(coord)));
    for (let data of hexData) if (!data.player) return false;
    let uniquePlayers = new Set(hexData.map(x => x.player).filter(player => player != 'dead'));
    if (uniquePlayers.size > 1) return false;
    return Array.from(uniquePlayers);
  }

  decrementAllHealth() {
    let {hexGrid} = this;
    let seen = new Set();
    for (let coord of hexGrid.validHexCoords) {
      let id = hexGrid.coordToId(coord);
      if (seen.has(id)) continue;

      let component = this.floodConnected(id);
      let allComponentData = Array.from(component).map(id => this.getElementData(id));
      let maxHealth = Math.max(...allComponentData.map(x => x.health));
      for (let data of allComponentData) {
        data.health = maxHealth;
      }

      let hexComponentData = Array.from(component)
        .filter(x => hexGrid.isHexId(x))
        .map(x => this.getElementData(x));
      for (let componentId of component) {
        seen.add(componentId);
        let data = this.getElementData(componentId);
        let nextHealth = data.player == this.currentPlayer ? data.health - 1 : data.health;
        data.health = Math.min(nextHealth, hexComponentData.length);
        if (data.health < 0) data.player = 'dead';
      }

      let maxTurn = Math.max(...hexComponentData.map(x => x.claimTurn));
      for (let data of hexComponentData) {
        data.showHealth = maxTurn == data.claimTurn;
      }
    }
  }

  nextTurn() {
    this.currentPlayerData.usingEdge = false;
    this.decrementAllHealth();
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    this.currentPlayerData.edgeCount += 1;
    this.turn++;

    let winners = this.checkGameOver();
    if (winners) {
      this.dispatchEvent(new CustomEvent('game-over', {detail: {winners}}));
    }

    this.dispatchEvent(new CustomEvent('next-turn',
      {detail: { currentPlayer: this.players[this.currentPlayerIndex] }}));
  }

  getClickableEdgeIds() {
    if (!this.clientIsPlayer) return [];
    return this.getClickableEdgeIdsForCurrentPlayer();
  }

  getClickableEdgeIdsForCurrentPlayer() {
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
    this.processTileClick(e.detail);
    this.dispatchEvent(new CustomEvent('tile-click',
      {detail: e.detail, bubbles: true, composed: true}));
  }

  processTileClick(detail) {
    let {id, tileType} = detail;
    let data = this.elementDataMap.get(id);
    let clickableEdges = this.getClickableEdgeIdsForCurrentPlayer();
    if (tileType == 'edge' && !(new Set(clickableEdges)).has(detail.id)) return;
    if (tileType == 'hex' && (data.player || this.currentPlayerData.usingEdge)) return;

    data.player = this.currentPlayer;
    data.claimTurn = this.turn;
    if (detail.tileType == 'hex') {
      this.incrementComponentHealth(id);
      this.nextTurn();
    } else if (detail.tileType == 'edge') {
      this.currentPlayerData.edgeCount--;
      this.currentPlayerData.usingEdge = true;
      if (this.currentPlayerData.edgeCount <= 0 || !clickableEdges.length) {
        this.nextTurn();
      }
    }
    this.requestUpdate();
  }
  
  incrementComponentHealth(id) {
    let {hexGrid} = this;
    let component = Array.from(this.floodConnected(id));
    let componentSize = component.filter(id => hexGrid.isHexId(id)).length;
    let data = component.map(id => this.getElementData(id));
    for (let x of data) x.health = componentSize + 1;
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
      let style = { };

      if (clickableEdges.has(id)) {
        style.stroke = 'gray';
      }

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
    let hexCenterX = hexCenterXFunction(GRID_NS, GRID_R, GRID_MARGIN);
    let hexCenterY = hexCenterYFunction(GRID_NS, GRID_R, GRID_MARGIN);
    let elementStyles = this.renderElementStyles();
    let healthIndicators = Array.from(this.elementDataMap.entries())
      .map(([id, entry]) => {
        if (!entry.showHealth || entry.player == 'dead') return;
        let coord = JSON.parse(id);
        let style = styleMap({
          left: `calc(${hexCenterX(...coord)}% - 10pt)`,
          top: `calc(${hexCenterY(...coord)}% - 10pt)`,
        });
        return html`<div class="health-indicator" style="${style}">${entry.health}</div>`;
      }).filter(x => x);

    return html`
      <div id="info">
        <div class="heading">Edge Counts</div>
        ${this.playerData.map(this.renderPlayerData.bind(this))}
      </div>
      <div id="wrapper">
        <div id="frame">
          ${healthIndicators}
          <hex-grid ns=${GRID_NS} r=${GRID_R} margin=${GRID_MARGIN} .elementStyles=${elementStyles}
              @tile-click=${this.onTileClick}
              @tile-mouseover=${this.onTileMouseOver}
              @tile-mouseout=${this.onTileMouseOut}
            ></hex-grid>
        </div>
     </div>
    `;
  }
}

customElements.define('hexa-slime-game', HexaSlimeGame);


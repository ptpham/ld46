
import {LitElement, html, css, svg} from 'lit-element';
import './hex-grid';

import {validCoords} from './hex-grid';

let PLAYER_COLOR_MAP = {
  'blue': {
    highlightColor: 'lightskyblue',
    hexColor: 'royalblue',
    edgeColor: 'cornflowerblue',
  },
  'red': {
    highlightColor: 'lightcoral',
    hexColor: 'red',
    edgeColor: 'indianred',
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

    this.playerStateMap = new Map(players.map(player => [player, {}]));
    this.requestUpdate();
  }

  getElementsForPlayer(target) {
    return Array.from(this.elementDataMap.entries())
      .filter(([id, entry]) => entry.player == target)
      .map(([id, entry]) => id);
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
      .filter(id => !this.elementDataMap.get(id).player);
  }

  get hexGrid() {
    return this.shadowRoot.querySelector('hex-grid');
  }

  onTileClick(e) {
    if (!this.clientIsPlayer) return;
    let {id, tileType} = e.detail;
    let data = this.elementDataMap.get(id);
    if (tileType == 'edge' && !(new Set(this.getClickableEdgeIds())).has(e.detail.id)) return;
    if (tileType == 'hex' && data.player) return;
    data.player = this.currentPlayer;
    if (e.detail.tileType == 'hex') {
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
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
    let {id, coord} = e.detail;
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

    for (let coord of hexGrid.validCoords) {
      let id = hexGrid.coordToId(coord);
      let clickableEdges = new Set(this.getClickableEdgeIds());

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

  render() {
    let elementStyles = this.renderElementStyles();
    return html`
      <hex-grid ns=${GRID_NS} r=5.5 margin=1 .elementStyles=${elementStyles}
          @tile-click=${this.onTileClick}
          @tile-mouseover=${this.onTileMouseOver}
          @tile-mouseout=${this.onTileMouseOut}
        ></hex-grid>
    `;
  }
}

customElements.define('hexa-slime-game', HexaSlimeGame);



import {LitElement, html, css, svg} from 'lit-element';
import './hex-grid';

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
    this.elementPlayerMap = new Map();
    let {players = []} = this;
    this.playerStateMap = new Map(players.map(player => [player, {}]));
    this.requestUpdate();
  }

  getElementsForPlayer(target) {
    return Array.from(this.elementPlayerMap.entries())
      .filter(([id, player]) => player == target)
      .map(([id, player]) => id);
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
      .filter(id => !this.elementPlayerMap.has(id));
  }

  get hexGrid() {
    return this.shadowRoot.querySelector('hex-grid');
  }

  onHexClick(e) {
    if (!this.clientIsPlayer) return;
    this.elementPlayerMap.set(e.detail.id, this.currentPlayer);
    this.requestUpdate();
  }

  onTileClick(e) {
    if (!this.clientIsPlayer) return;
    let {tileType} = e.detail;
    if (tileType == 'edge' && !(new Set(this.getClickableEdgeIds())).has(e.detail.id)) return;
    if (tileType == 'hex' && this.elementPlayerMap.has(e.detail.id)) return;
    this.elementPlayerMap.set(e.detail.id, this.currentPlayer);
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

    let {elementPlayerMap} = this;

    function isFilledCorner(coord) {
      let adjacent = hexGrid.cornerAdjacentEdges(coord).map(x => elementPlayerMap.get(hexGrid.coordToId(x)))
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

      let elementPlayer = this.elementPlayerMap.get(id);

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
      <hex-grid ns=5 r=5.5 margin=1 .elementStyles=${elementStyles}
          @tile-click=${this.onTileClick}
          @tile-mouseover=${this.onTileMouseOver}
          @tile-mouseout=${this.onTileMouseOut}
        ></hex-grid>
    `;
  }
}

customElements.define('hexa-slime-game', HexaSlimeGame);



import {LitElement, html, css, svg} from 'lit-element';
import './hex-grid';

let PLAYER_COLOR_MAP = {
  'blue': {
    highlightColor: 'lightskyblue',
    hexColor: 'royalblue',
    strokeColor: 'royalblue',
  },
  'red': {
    highlightColor: 'pink',
    hexColor: 'red',
    strokeColor: 'red',
  },
};

export class HexaSlimeGame extends LitElement {

  static get properties() {
    return {
      hoverId: {type: String},
      players: {type: Array},
      currentPlayer: {type: String},
      clientIsPlayer: {type: Boolean},
    };
  }
  
  constructor() {
    super();
    this.restart();
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

  onEdgeClick(e) {
    if (!(new Set(this.getClickableEdgeIds())).has(e.detail.id)) return;
    if (!this.clientIsPlayer) return;
    this.elementPlayerMap.set(e.detail.id, this.currentPlayer);
    this.requestUpdate();
  }

  setHoverId(newId) {
    this.hoverId = null;
    if (this.clientIsPlayer) {
      this.hoverId = newId;
    }
  }

  onHexMouseOver(e) {
    let {id, coord} = e.detail;
    this.setHoverId(id);
  }

  onHexMouseOut(e) {
    this.setHoverId(null);
  }

  onEdgeMouseOver(e) {
    this.setHoverId(e.detail.id);
  }

  onEdgeMouseOut(e) {
    this.setHoverId(null);
  }

  renderElementStyles() {
    let elementStyles = new Map();

    let {hexGrid} = this;
    if (!hexGrid) return elementStyles;

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
        style.stroke = PLAYER_COLOR_MAP[elementPlayer].strokeColor;
      }

      elementStyles.set(id, style);
    }

    return elementStyles;
  }

  render() {
    let elementStyles = this.renderElementStyles();
    return html`
      <hex-grid ns=5 r=5.5 margin=1 .elementStyles=${elementStyles}
          @hex-click=${this.onHexClick}
          @hex-mouseover=${this.onHexMouseOver}
          @hex-mouseout=${this.onHexMouseOut}
          @edge-click=${this.onEdgeClick}
          @edge-mouseover=${this.onEdgeMouseOver}
          @edge-mouseout=${this.onEdgeMouseOut}
        ></hex-grid>
    `;
  }
}

customElements.define('hexa-slime-game', HexaSlimeGame);


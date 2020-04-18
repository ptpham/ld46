
import {LitElement, html, css, svg} from 'lit-element';
import './hex-grid';


export class HexaSlimeGame extends LitElement {

  static get properties() {
    return {
      hoverId: {type: String},
    };
  }
  
  constructor() {
    super();
    this.elementColors = new Map();
  }

  get hexGrid() {
    return this.shadowRoot.querySelector('hex-grid');
  }

  onHexClick(e) {
    this.elementColors.set(e.detail.id, 'blue');
    this.requestUpdate();
  }

  setHoverId(newId) {
    this.hoverId = newId;
  }

  onHexMouseOver(e) {
    this.setHoverId(e.detail.id);
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
      let style = {};

      if (id == this.hoverId) {
        style.fill = 'cyan';
        style.stroke = 'cyan';
      }

      if (this.elementColors.get(id)) {
        style.fill = this.elementColors.get(id);
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
          @edge-mouseover=${this.onEdgeMouseOver}
          @edge-mouseout=${this.onEdgeMouseOut}
        ></hex-grid>
    `;
  }
}

customElements.define('hexa-slime-game', HexaSlimeGame);


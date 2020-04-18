
import {LitElement, html, css, svg} from 'lit-element';
import './hex-grid';

export class HexaSlimeGame extends LitElement {

  static get properties() {
    return {
      hexStyles: {type: Object},
    };
  }
  
  constructor() {
    super();
    this.hexStyles = new Map();
  }

  get hexGrid() {
    return this.shadowRoot.querySelector('hex-grid');
  }

  onHexClick(e) {
    this.hexStyles.set(e.detail.id, {fill: 'blue'});
    this.hexGrid.requestUpdate();
  }

  setHoverId(newId) {
    let {hexGrid} = this;
    for (let coord of hexGrid.validCoords) {
      let id = hexGrid.coordToId(coord);
      let style = this.hexStyles.get(id) || {};

      if (id == newId || newId == null) {
        style.opacity = 1;
      } else {
        style.opacity = 0.7;
      }
      this.hexStyles.set(id, style);
    }
    this.hexGrid.requestUpdate();
  }

  onHexMouseOver(e) {
    this.setHoverId(e.detail.id);
  }

  onHexMouseOut(e) {
    this.setHoverId(null);
  }

  render() {
    return html`
      <hex-grid ns=5 r=7 .hexStyles=${this.hexStyles}
          @hex-click=${this.onHexClick}
          @hex-mouseover=${this.onHexMouseOver}
          @hex-mouseout=${this.onHexMouseOut}
        ></hex-grid>
    `;
  }
}

customElements.define('hexa-slime-game', HexaSlimeGame);


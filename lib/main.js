
import './hexa-slime-game.js'

import {LitElement, html, css, svg} from 'lit-element';
import {styleMap} from 'lit-html/directives/style-map';

class ModalFrame extends LitElement {

  static get properties() {
    return {
      show: {type: Boolean},
    };
  }

  static get styles() {
    return css`
      :host {
        position: fixed;
        width: 100vw;
        height: 100vh;
        background: rgba(0,0,0,0.8);
        z-index: 2000;
      }

      #wrapper {
        height: 80%;
        width: 50%;
        background: white;
        border-radius: 20pt;
        box-shadow: 0 0 10pt 0 black;
        position: fixed;
        top: 10%;
        left: 25%;
        padding: 20pt;
        box-sizing: border-box;

        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
    `;
  }
  
  render() {
    return html`<div id="wrapper"><slot></slot></div>`;
  }
}

customElements.define('modal-frame', ModalFrame);

export class HexaSlimeGameManager extends LitElement {
  
  static get properties() {
    return {
      showModal: {type: Boolean}
    };
  }

  static get styles() {
    return css`
      :host {
        font-weight: lighter;
      }

      button {
        font-size: 20pt;
        padding: 0 15pt;
        border: 1pt solid gray;
        box-shadow: none;
        transition: box-shadow 0.2s;
        cursor: pointer;
        border-radius: 50pt;
        font-weight: lighter;
        outline: none;
      }

      button:hover {
        box-shadow: 0 2 4pt 0 rgba(0,0,0,0.3);
      }
    `;
  }

  constructor() {
    super();
    this.showModal = true;
  }

  startLocalGame() {
    let game = this.shadowRoot.querySelector('hexa-slime-game');
    game.players = ['red', 'blue'];
    game.restart();
    this.showModal = false;
  }

  renderModal() {
    if (!this.showModal) return null;
    return html`
      <modal-frame>
        <h1>HEXASLIME</h1>

        <div>
        <h3>INTRO</h3>
        Dr. Slimentist was working late in his lab one night and created
        sentient slime blobs in this giant novelty, hexagonally tiled petri
        dish gifted to him by his Aunt Bertrude for Christmas. He watches on in
        fascination as the slimes struggle to keep themselves alive.

        <h3>RULES</h3>
        Each turn, you may take one of two actions:
        <ul>
          <li>Click on a hex tile to claim it.</li>
          <li>Click on a edges to claim them. Edges must be adjacent to hexes
          or edges that you already own. If you choose to do this, you must
          claim the number of edges associated with your color on the left if
          there are available unclaimed edges.</li>
        </ul>

        Each connected blob has health that decreases every round. When a
        connected blob's health drops below zero, it dies. When a blob gets an
        additional hex, it's health increases to the number of hexes that
        compose it. Two blobs connected by an edge will take on the maximum
        health between them. Two adjacent hexes of the same color are connected
        if the edge between them is claimed by the same player or is unclaimed.
        A hex is connected to an edge if the edge is one of the hexes edges.
        Edges are connected if they share a corner.

        </div>
        <button @click="${this.startLocalGame}">START LOCAL GAME</button>
      </modal-frame>
    `;
  }

  render() {
    return html`
      ${this.renderModal()}
      <hexa-slime-game currentPlayerIndex=0 .players="${['red', 'blue']}"
        clientIsPlayer="true"></hexa-slime-game>
    `;
  }
}

customElements.define('hexa-slime-game-manager', HexaSlimeGameManager);


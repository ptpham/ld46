
import {PLAYER_COLOR_MAP} from './hexa-slime-game.js'

import {LitElement, html, css, svg} from '../node_modules/lit-element/lit-element.js';

class ModalFrame extends LitElement {

  static get properties() {
    return {
      show: {type: Boolean},
    };
  }

  static get styles() {
    return css`
      #shade {
        position: fixed;
        width: 100vw;
        height: 100vh;
        background: rgba(0,0,0,0.8);
        transition: background 0.2s;
        z-index: 2000;
      }

      #shade.hidden {
        pointer-events: none;
        background: transparent;
      }

      #wrapper {
        height: 80%;
        width: 70%;
        background: white;
        border-radius: 20pt;
        box-shadow: 0 0 10pt 0 black;
        position: fixed;
        top: 10%;
        left: 15%;
        padding: 20pt;
        box-sizing: border-box;

        display: flex;
        flex-direction: column;
        justify-content: space-between;
        transition: opacity 0.2s;
        opacity: 1;
      }

      .hidden #wrapper {
        opacity: 0;
      }
    `;
  }
  
  render() {
    let showClass = this.show ? '' : 'hidden';

    return html`
      <div id="shade" class="${showClass}">
        <div id="wrapper"><slot></slot>
        </div>
      </div>`;
  }
}

customElements.define('modal-frame', ModalFrame);

export class HexaSlimeGameManager extends LitElement {
  
  static get properties() {
    return {
      showModal: {type: Boolean},
      winners: {type: Array},
      peerId: {type: String},
      serverId: {type: String},
      connectedServerId: {type: String},
      connectedPeerIds: {type: Array},
      currentPlayer: {type: String},
      players: {type: Array}, 
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

      button + button {
        margin-top: 10pt;
      }

      button:hover {
        color: white;
        background: dimgray;
      }

      hex-grid {
        flex: 1;
      }

      #intro {
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      #instructions {
        overflow-y: auto;
        box-shadow: 0 0 8pt 0 rgba(0,0,0,0.2) inset;
        padding: 0 10pt;
        padding-bottom: 10pt;
        margin-bottom: 20pt;
      }

      input {
        width: 100%;
        border: 1pt solid gray;
        font-size: 20pt;
        border-radius: 100pt;
        padding: 5pt 20pt;
        outline: none;
        margin-bottom: 20pt;
      }

      #player-list {
        margin-bottom: 20pt;
      }

      .message {
        margin-top: 10pt;
      }

      #colored-characters span:nth-child(odd) {
        color: blue;
      }

      #colored-characters span:nth-child(even) {
        color: red;
      }
    `;
  }

  constructor() {
    super();
    this.showModal = 'intro';
    this.players = ['red', 'blue'];
  }

  get game() {
    return this.shadowRoot.querySelector('hexa-slime-game');
  }

  startLocalGame() {
    let game = this.game;
    game.players = this.players;
    game.restart();
    this.showModal = false;
    this.gameMode = 'local';
  }

  startNetworkGame() {
    this.startAsClient(this.players[0]);
    this.currentPlayer = this.players[0];
    this.dispatchEvent(new CustomEvent('server-start'));
  }

  startAsClient(player) {
    let game = this.game;
    game.players = this.players;
    this.gameMode ='network';
    game.restart();
    this.showModal = false;
    this.clientPlayer = player;
  }

  renderModal() {
    if (!this.showModal) return null;
    
    switch (this.showModal) {
      case 'intro':
        return this.renderIntro();
      case 'game-over':
        return this.renderGameOver();
      case 'network-server':
        return this.renderServerGame();
      case 'network-client':
        return this.renderClientGame();
    }
    return null;
  }

  returnToIntro() {
    this.showModal = 'intro';
  }

  renderGameOver() {
    let winners = this.winners || [];
    let heading = winners.length ? 'WINNER' : 'NO WINNERS';
    let elementStyles = new Map();

    let player = winners[0] || 'dead';
    elementStyles.set('[0,0]', {
      fill: PLAYER_COLOR_MAP[player].hexColor,
      stroke: PLAYER_COLOR_MAP[player].edgeColor,
    });
    return html`
      <h1 style="align-self: center">${heading}</h1>
      <hex-grid r=30 ns=1 margin=5 .elementStyles="${elementStyles}"
        .offsetX="${5}" .offsetY="${-30}"></hex-grid>
      <button @click="${this.returnToIntro}">RETURN TO INTRO</button>
    `;
  }

  configureNetworkGame() {
    this.showModal = 'network-server';
  }

  handleRemoteTileClick(detail) {
    this.game.processTileClick(detail);
  }

  renderIntro() {
    return html`
      <div id="intro">
        <h1><span id="colored-characters"><span>H</span><span>E</span><span>X</span><span>A</span></span>SLIME</h1>

        <div id="instructions">
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
          <li>You gain one usable edge per turn.</li>
        </ul>

        Connected hexes and edges make blobs:
        <ul>
          <li> Two adjacent hexes of the same color are connected if the edge
            between them is claimed by the same player or is unclaimed.</li>
          <li> A hex is connected to an edge if the edge is one of the hex's
            edges.</li>
          <li> Edges are connected if they share a corner.</li>
        </ul>

        Keep your blobs alive:
        <ul>
          <li>Each blob has health that decreases every round.</li>
          <li>When a blob's health drops below zero, it dies. </li>
          <li>A blob's health is shown by a number on the newest hex in the
            blob.</li>
          <li>When a blob gets an additional hex, it's health increases to the
            number of hexes that compose it.</li>
          <li>Blobs may not have more health than the number of hexes that
          compose it. This means that splitting blobs can make them lose
          health.</li>
          <li> Two blobs connected by an edge will take on the maximum health
            between them.</li>
        </ul>

        Win the game:
        <ul>
          <li>The player with the last living blob on the field wins.</li>
          <li>If there are no living blobs, there is no winner.</li>
        </ul>

        </div>
        <button @click="${this.startLocalGame}">START LOCAL GAME</button>
        <button @click="${this.configureGameAsServer}">NETWORK GAME AS SERVER</button>
        <button @click="${this.configureGameAsClient}">NETWORK GAME AS CLIENT</button>
      </div>
    `;
  }

  configureGameAsServer() {
    this.showModal = 'network-server';
    this.dispatchEvent(new CustomEvent('server-setup'));
    this.isServer = true;
  }

  configureGameAsClient() {
    this.showModal = 'network-client';
    this.isServer = false;
  }

  updateServerId(e) {
    this.serverId = e.target.value;
  }

  connectToServer() {
    if (this.serverId && this.serverId != this.peerId) {
      this.dispatchEvent(new CustomEvent('server-connect', {detail: {serverId: this.serverId}}));
    }
  }

  renderServerGame() {
    let peerId = this.peerId || '[Loading...]';
    let emptyMessage = (!this.connectedPeerIds || !this.connectedPeerIds.length) ? '[No Players Connected]' : '';
    return html`
      <h1>NETWORK GAME AS SERVER</h1>
      <div>
        <p>Your server id is <b>${peerId}</b>. Send this
        value to other players to connect to your machine</p>
        <h3>CONNECTED PLAYERS</h3>
        <div id="player-list">
          ${emptyMessage} 
          ${(this.connectedPeerIds || []).map(id => html`<b>${id}</b>`)}
        </div>
        <button @click="${this.startNetworkGame}">START NETWORK GAME</button>
      </div>
      <button @click="${this.returnToIntro}">RETURN TO INTRO</button>
    `;
  }

  renderCurrentServerConnection() {
    if (!this.connectedServerId) return null;
    return html`<div class="message">Connected to server <b>${this.connectedServerId}</b></div>`;
  }

  renderClientGame() {
    return html`
      <h1>NETWORK GAME AS CLIENT</h1>
      <div>
        <p>Your id is <b>${this.peerId}</b>. Ask for the serving player's server id
        and enter it below.</p>
        <input value="${this.serverId || ''}" @input="${this.updateServerId}"></input>
        <button @click="${this.connectToServer}">CONNECT TO SERVER</button>
        ${this.renderCurrentServerConnection()}
      </div>
      <button @click="${this.returnToIntro}">RETURN TO INTRO</button>
    `;
  }

  onGameOver(e) {
    this.winners = e.detail.winners;
    this.showModal = 'game-over';
  }

  onNextTurn(e) {
    this.currentPlayer = e.detail.currentPlayer;
  }

  render() {
    let clientIsPlayer = this.gameMode == 'local' ||
      (this.clientPlayer && this.currentPlayer == this.clientPlayer);
    return html`
      <modal-frame .show=${this.showModal}>
        ${this.renderModal()}
      </modal-frame>
      <hexa-slime-game currentPlayerIndex=0 .players="${this.players}"
        @game-over=${this.onGameOver} @next-turn="${this.onNextTurn}"
        .clientIsPlayer="${clientIsPlayer}"></hexa-slime-game>
    `;
  }
}

customElements.define('hexa-slime-game-manager', HexaSlimeGameManager);


import * as PIXI from 'pixi.js';
import { GAME_BOY_CONFIG } from '../../../../../../game-boy/data/game-boy-config';

export default class Score extends PIXI.Container {
  constructor() {
    super();

    this._scoreText = null;
    this._score = 0;

    this._init();
  }

  addScore(score) {
    this._score += score;
    this._scoreText.text = this._score.toString().padStart(5, '0');
  }

  reset() {
    this._score = 0;
    this._scoreText.text = '00000';
  }

  _init() {
    const caption = new PIXI.Text('SCORE', new PIXI.TextStyle({
      fontFamily: 'dogicapixel',
      fontSize: 8,
      fill: GAME_BOY_CONFIG.screen.blackColor,
    }));

    this.addChild(caption);

    const scoreText = this._scoreText = new PIXI.Text('00000', new PIXI.TextStyle({
      fontFamily: 'dogicapixel',
      fontSize: 8,
      fill: GAME_BOY_CONFIG.screen.blackColor,
    }));

    this.addChild(scoreText);

    scoreText.x = 40;
  }
}

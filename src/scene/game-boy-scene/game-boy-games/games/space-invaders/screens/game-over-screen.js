import * as PIXI from 'pixi.js';
import { GAME_BOY_CONFIG } from "../../../../game-boy/data/game-boy-config";
import GameScreenAbstract from "../../shared/game-screen-abstract";
import Delayed from '../../../../../../core/helpers/delayed-call';

export default class GameOverScreen extends GameScreenAbstract {
  constructor() {
    super();

    this._timer = null;

    this._init();
  }

  show() {
    super.show();

    this._timer = Delayed.call(2000, () => {
      this.events.emit('onGameOverEnd');
    });
  }

  stopTweens() {
    if (this._timer) {
      this._timer.stop();
    }
  }

  _init() {
    const text = new PIXI.Text('GAME OVER', new PIXI.TextStyle({
      fontFamily: 'dogicapixel',
      fontSize: 8,
      fill: GAME_BOY_CONFIG.screen.blackColor,
    }));

    this.addChild(text);

    text.x = GAME_BOY_CONFIG.screen.width * 0.5 - 30;
    text.y = GAME_BOY_CONFIG.screen.height * 0.5 - 4;
  }
}

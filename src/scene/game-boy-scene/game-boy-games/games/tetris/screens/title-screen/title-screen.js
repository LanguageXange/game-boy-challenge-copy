import * as PIXI from 'pixi.js';
import Loader from '../../../../../../../core/loader';
import { GAME_BOY_CONFIG } from '../../../../../game-boy/data/game-boy-config';
import GameScreenAbstract from '../../../shared/game-screen-abstract';
import Delayed from '../../../../../../../core/helpers/delayed-call';
import { TETRIS_SCREEN_TYPE } from '../../data/tetris-data';
import { BUTTON_TYPE } from '../../../../../game-boy/data/game-boy-data';
import GameBoyAudio from '../../../../../game-boy/game-boy-audio/game-boy-audio';
import { GAME_BOY_SOUND_TYPE } from '../../../../../game-boy/game-boy-audio/game-boy-audio-data';
import { TETRIS_CONFIG } from '../../data/tetris-config';

export default class TitleScreen extends GameScreenAbstract {
  constructor() {
    super();

    this._screenType = TETRIS_SCREEN_TYPE.Title;
    this._arrow = null;
    this._blinkTimer = null;

    this._init();
  }

  show() {
    super.show();

    GameBoyAudio.playSound(GAME_BOY_SOUND_TYPE.TetrisMusic);
    this._blinkArrow();
  }

  onButtonPress(buttonType) {
    if (buttonType === BUTTON_TYPE.Start || buttonType === BUTTON_TYPE.A || buttonType === BUTTON_TYPE.B) {
      this.events.emit('onStartGame');
    }

    if (buttonType === BUTTON_TYPE.Select) {
      GameBoyAudio.switchSound(GAME_BOY_SOUND_TYPE.TetrisMusic);
      TETRIS_CONFIG.isMusicAllowed = !TETRIS_CONFIG.isMusicAllowed;
    }
  }

  stopTweens() {
    if (this._blinkTimer) {
      this._blinkTimer.stop();
    }
  }

  _blinkArrow() {
    this._blinkTimer = Delayed.call(700, () => {
      this._arrow.visible = !this._arrow.visible;
      this._blinkArrow();
    });
  }

  _init() {
    this._initBackground();
    this._initStartText();
    this._initArrow();
  }

  _initBackground() {
    const texture = Loader.assets['ui_assets/tetris/title-screen'];

    const screen = new PIXI.Sprite(texture);
    this.addChild(screen);
    screen.tint = GAME_BOY_CONFIG.screen.tint;
  }

  _initStartText() {
    const text = new PIXI.Text('Start game', new PIXI.TextStyle({
      fontFamily: 'tetris',
      fontSize: 8,
      fill: GAME_BOY_CONFIG.screen.blackColor,
    }));

    this.addChild(text);

    text.anchor.set(0.5, 0);

    text.x = GAME_BOY_CONFIG.screen.width * 0.5;
    text.y = 113;
  }

  _initArrow() {
    const arrow = this._arrow = new PIXI.Graphics();
    this.addChild(arrow);

    arrow.beginFill(GAME_BOY_CONFIG.screen.blackColor);
    arrow.moveTo(0, 0);
    arrow.lineTo(4, 3);
    arrow.lineTo(0, 6);

    arrow.x = GAME_BOY_CONFIG.screen.width * 0.5 - 45;
    arrow.y = 116;
  }
}

import * as PIXI from 'pixi.js';
import Loader from '../../../../../../../../core/loader';
import { ENEMIES_CONFIG, ENEMY_MOVEMENT_DIRECTION } from './data/enemy-config';
import { GAME_BOY_CONFIG } from '../../../../../../game-boy/data/game-boy-config';
import { SPACE_INVADERS_CONFIG } from '../../../data/space-invaders-config';

export default class Enemy extends PIXI.Container {
  constructor(type) {
    super();

    this.events = new PIXI.utils.EventEmitter();

    this._type = type;
    this._config = ENEMIES_CONFIG[type];
    this._view = null;

    this._textureIndex = 0;
    this._isActive = false;

    this._speed = 1;
    this._moveTime = 0;
    this._moveInterval = 500 / this._speed;
    this._moveDirection = ENEMY_MOVEMENT_DIRECTION.Right;

    this._init();
  }

  update(dt) {
    if (!this._isActive) {
      return;
    }

    this._moveTime += dt * 1000;

    if (this._moveTime >= this._moveInterval) {
      this._moveTime = 0;
      this._move();
    }
  }

  activate() {
    this._isActive = true;
  }

  show() {
    this.visible = true;
  }

  kill() {
    this.visible = false;
    this._isActive = false;
  }

  setDirection(direction) {
    this._moveDirection = direction;
  }

  moveDown() {
    this.y += 12;
  }

  increaseSpeed() {
    this._speed += 2;
    this._moveInterval = 500 / this._speed;
  }

  _move() {
    if (this.x >= SPACE_INVADERS_CONFIG.field.width - this.width) {
      this.events.emit('changeDirectionToLeft');
    }

    if (this.x <= 0) {
      this.events.emit('changeDirectionToRight');
    }

    if (this._moveDirection === ENEMY_MOVEMENT_DIRECTION.Right) {
      this.x += 1;
    }

    if (this._moveDirection === ENEMY_MOVEMENT_DIRECTION.Left) {
      this.x -= 1;
    }

    this._updateTexture();
  }

  _updateTexture() {
    this._textureIndex = (this._textureIndex + 1) % this._config.textures.length;
    const texture = Loader.assets[this._config.textures[this._textureIndex]];
    this._view.texture = texture;
  }

  _init() {
    this._initView();

    this.visible = false;
  }

  _initView() {
    const texture = Loader.assets[this._config.textures[this._textureIndex]];

    const view = this._view = new PIXI.Sprite(texture);
    this.addChild(view);
    view.tint = GAME_BOY_CONFIG.screen.tint;
  }
}
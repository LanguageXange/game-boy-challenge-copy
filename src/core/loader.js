import * as THREE from "three";
import * as PIXI from "pixi.js";
import { AssetManager, GameObject, MessageDispatcher } from "black-engine";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader";

const textures = [
  "baked-game-boy.jpg",
  "baked-cartridge-tetris.jpg",
  "baked-cartridge-tetris-in-pocket.jpg",
  "baked-cartridge-zelda.jpg",
  "baked-cartridge-zelda-in-pocket.jpg",
  "baked-cartridge-space-invaders.jpg",
  "baked-cartridge-space-invaders-in-pocket.jpg",
  "baked-power-indicator.jpg",
  "baked-screen.jpg",
  "baked-screen-shadow.png",
  "baked-cartridge-pocket.jpg",
  "baked-cartridge-pocket-with-cartridge.jpg",

  "background.jpg",
];

const models = ["game-boy.glb", "game-boy-cartridge.glb"];

const images = ["overlay.png", "sound-icon.png", "sound-icon-mute.png"];

const pixiAssets = [
  // Tetris
  "ui_assets/nintendo-logo-screen.png",
  "ui_assets/stop-sign.png",

  "ui_assets/tetris/title-screen.png",
  "ui_assets/tetris/license-screen.png",
  "ui_assets/tetris/gameplay-screen.png",
  "ui_assets/tetris/game-over-block.png",
  "ui_assets/tetris/game-over-frame.png",

  "ui_assets/tetris/block-i-edge.png",
  "ui_assets/tetris/block-i-middle.png",
  "ui_assets/tetris/block-j.png",
  "ui_assets/tetris/block-l.png",
  "ui_assets/tetris/block-o.png",
  "ui_assets/tetris/block-s.png",
  "ui_assets/tetris/block-t.png",
  "ui_assets/tetris/block-z.png",

  "fonts/tetris.ttf",

  // Space invaders
  "ui_assets/space-invaders/title-screen-clean.png",
  "ui_assets/space-invaders/space-invaders-logo.png",
  "ui_assets/space-invaders/start-text.png",
  "ui_assets/space-invaders/player.png",
  "ui_assets/space-invaders/enemy01-frame01.png",
  "ui_assets/space-invaders/enemy01-frame02.png",
  "ui_assets/space-invaders/player-missile.png",
  "ui_assets/space-invaders/player-missile-explode.png",
  "ui_assets/space-invaders/enemy-kill.png",
  "ui_assets/space-invaders/enemy-missile-electric-01.png",
  "ui_assets/space-invaders/enemy-missile-electric-02.png",
  "ui_assets/space-invaders/enemy-missile-electric-03.png",
  "ui_assets/space-invaders/enemy-missile-electric-04.png",
  "ui_assets/space-invaders/enemy-missile-explode.png",
  "ui_assets/space-invaders/player-hit.png",

  "fonts/dogicapixel.ttf",
];

const sounds = [
  "power-switch.mp3",
  "insert-cartridge.mp3",
  "eject-cartridge.mp3",
  "game-boy-load.mp3",
  "zelda-intro-sound.mp3",

  // tetris
  "tetris-music.mp3",
  "move-side.mp3",
  "rotate-shape.mp3",
  "shape-fall.mp3",
  "line-clear.mp3",
  "tetris-pause.mp3",
  "tetris-game-over.mp3",

  // space invaders
  "player-shoot.mp3",
  "enemy-killed.mp3",
  "player-killed.mp3",
];

const loadingPercentElement = document.querySelector(".loading-percent");
let progressRatio = 0;
const blackAssetsProgressPart = 0;
let isSoundsLoaded = false; // eslint-disable-line no-unused-vars

export default class Loader extends GameObject {
  constructor() {
    super();

    Loader.assets = {};
    Loader.events = new MessageDispatcher();

    this._threeJSManager = new THREE.LoadingManager(
      this._onThreeJSAssetsLoaded,
      this._onThreeJSAssetsProgress
    );
    this._blackManager = new AssetManager();

    this._soundsCountLoaded = 0;

    this._loadBlackAssets();
  }

  _loadBlackAssets() {
    const imagesBasePath = "/ui_assets/";

    images.forEach((textureFilename) => {
      const imageFullPath = `${imagesBasePath}${textureFilename}`;
      const imageName = textureFilename.replace(/\.[^/.]+$/, "");
      this._blackManager.enqueueImage(imageName, imageFullPath);
    });

    this._blackManager.on("complete", this._onBlackAssetsLoaded, this);
    this._blackManager.on("progress", this._onBlackAssetsProgress, this);

    this._blackManager.loadQueue();
  }

  _onBlackAssetsProgress(item, progress) {
    // eslint-disable-line no-unused-vars
    // progressRatio = progress;
    // const percent = Math.floor(progressRatio * 100);
    // loadingPercentElement.innerHTML = `${percent}%`;
  }

  _onBlackAssetsLoaded() {
    this.removeFromParent();
    this._loadPixiAssets();
  }

  _loadPixiAssets() {
    const texturesNames = [];

    pixiAssets.forEach((textureFilename) => {
      const textureName = textureFilename.replace(/\.[^/.]+$/, "");
      PIXI.Assets.add(textureName, textureFilename);

      texturesNames.push(textureName);
    });

    const texturesPromise = PIXI.Assets.load(texturesNames);

    texturesPromise.then((textures) => {
      texturesNames.forEach((name) => {
        this._onAssetLoad(textures[name], name);
      });

      this._loadThreeJSAssets();
    });
  }

  _loadThreeJSAssets() {
    this._loadTextures();
    this._loadModels();
    this._loadAudio();

    if (textures.length === 0 && models.length === 0 && sounds.length === 0) {
      this._onThreeJSAssetsLoaded();
    }
  }

  _onThreeJSAssetsLoaded() {
    setTimeout(() => {
      loadingPercentElement.innerHTML = `100%`;
      loadingPercentElement.classList.add("ended");

      setTimeout(() => {
        loadingPercentElement.style.display = "none";
      }, 300);
    }, 450);

    setTimeout(() => {
      const customEvent = new Event("onLoad");
      document.dispatchEvent(customEvent);

      if (isSoundsLoaded) {
        Loader.events.post("onAudioLoaded");
      }
    }, 100);
  }

  _onThreeJSAssetsProgress(itemUrl, itemsLoaded, itemsTotal) {
    progressRatio = Math.min(
      blackAssetsProgressPart + itemsLoaded / itemsTotal,
      0.98
    );

    const percent = Math.floor(progressRatio * 100);
    loadingPercentElement.innerHTML = `${percent}%`;
  }

  _loadTextures() {
    const textureLoader = new THREE.TextureLoader(this._threeJSManager);

    const texturesBasePath = "/textures/";

    textures.forEach((textureFilename) => {
      const textureFullPath = `${texturesBasePath}${textureFilename}`;
      const textureName = textureFilename.replace(/\.[^/.]+$/, "");
      Loader.assets[textureName] = textureLoader.load(textureFullPath);
    });
  }

  _loadModels() {
    const gltfLoader = new GLTFLoader(this._threeJSManager);

    const modelsBasePath = "/models/";

    models.forEach((modelFilename) => {
      const modelFullPath = `${modelsBasePath}${modelFilename}`;
      const modelName = modelFilename.replace(/\.[^/.]+$/, "");
      gltfLoader.load(modelFullPath, (gltfModel) =>
        this._onAssetLoad(gltfModel, modelName)
      );
    });
  }

  _loadAudio() {
    const audioLoader = new THREE.AudioLoader(this._threeJSManager);

    const audioBasePath = "/audio/";

    sounds.forEach((audioFilename) => {
      const audioFullPath = `${audioBasePath}${audioFilename}`;
      const audioName = audioFilename.replace(/\.[^/.]+$/, "");
      audioLoader.load(audioFullPath, (audioBuffer) => {
        this._onAssetLoad(audioBuffer, audioName);

        this._soundsCountLoaded += 1;

        if (this._soundsCountLoaded === sounds.length) {
          isSoundsLoaded = true;
          Loader.events.post("onAudioLoaded");
        }
      });
    });
  }

  _onAssetLoad(asset, name) {
    Loader.assets[name] = asset;
  }
}

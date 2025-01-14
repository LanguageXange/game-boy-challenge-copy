import * as THREE from "three";
import * as PIXI from "pixi.js";
import { TWEEN } from "/node_modules/three/examples/jsm/libs/tween.module.min.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutlinePass } from "three/addons/postprocessing/OutlinePass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { FXAAShader } from "three/addons/shaders/FXAAShader.js";
import SCENE_CONFIG from "./configs/scene-config";
import MainScene from "../main-scene";
import LoadingOverlay from "./loading-overlay";
// black engine library
// https://blacksmith2d.io/

import {
  Black,
  CanvasDriver,
  Engine,
  Input,
  MasterAudio,
  StageScaleMode,
} from "black-engine";
import Loader from "./loader";
import Scene3DDebugMenu from "./helpers/gui-helper/scene-3d-debug-menu";
import DEBUG_CONFIG from "./configs/debug-config";
import Materials from "./materials";
import WebGL from "three/addons/capabilities/WebGL.js";
import { GLOBAL_LIGHT_CONFIG } from "./configs/global-light-config";
import isMobile from "ismobilejs";
import { GAME_BOY_CONFIG } from "../scene/game-boy-scene/game-boy/data/game-boy-config";

export default class BaseScene {
  constructor() {
    this._scene = null;
    this._renderer = null;
    this._camera = null;
    this._loadingOverlay = null;
    this._mainScene = null;
    this._scene3DDebugMenu = null;
    this._effectComposer = null;
    this._outlinePass = null;
    this._orbitControls = null;
    this._audioListener = null;
    this._renderPass = null;
    this._pixiApplication = null;

    this._windowSizes = {};
    this._isAssetsLoaded = false;

    SCENE_CONFIG.isMobile = isMobile(window.navigator).any;
    this._isKeyboardShortcutsShown = false;

    this._init();
  }

  createGameScene() {
    this._initMaterials();

    const data = {
      scene: this._scene,
      camera: this._camera,
      renderer: this._renderer,
      orbitControls: this._orbitControls,
      outlinePass: this._outlinePass,
      audioListener: this._audioListener,
      pixiApplication: this._pixiApplication,
    };

    this._mainScene = new MainScene(data);

    this._initMainSceneSignals();
  }

  afterAssetsLoaded() {
    this._isAssetsLoaded = true;

    this._loadingOverlay.hide();

    // I don't want to show the debug menu
    //this._scene3DDebugMenu.showAfterAssetsLoad();
    this._mainScene.afterAssetsLoad();
    this._setupBackgroundColor();

    this._showTextToLandscape();
    this._keyboardControls();
  }

  getOutlinePass() {
    return this._outlinePass;
  }

  _initMainSceneSignals() {
    this._mainScene.events.on("fpsMeterChanged", () =>
      this._scene3DDebugMenu.onFpsMeterClick()
    );
  }

  _init() {
    this._initBlack();
    this._initThreeJS();
    this._initPixiJS();
    this._initUpdate();
  }

  _initBlack() {
    const engine = new Engine("container", Loader, CanvasDriver, [
      Input,
      MasterAudio,
    ]);

    engine.pauseOnBlur = false;
    engine.pauseOnHide = false;
    engine.start();

    engine.stage.setSize(640, 960);
    engine.stage.scaleMode = StageScaleMode.LETTERBOX;
  }

  _initPixiJS() {
    const canvas = document.createElement("canvas");
    canvas.width = GAME_BOY_CONFIG.screen.width;
    canvas.height = GAME_BOY_CONFIG.screen.height;

    // const view = canvas.transferControlToOffscreen();

    this._pixiApplication = new PIXI.Application({
      view: canvas,
      width: GAME_BOY_CONFIG.screen.width,
      height: GAME_BOY_CONFIG.screen.height,
      background: GAME_BOY_CONFIG.screen.tint,
    });
  }

  _initThreeJS() {
    this._initScene();
    this._initRenderer();
    this._initCamera();
    this._initLights();
    this._initLoadingOverlay();
    this._initOnResize();
    this._initPostProcessing();
    this._initAudioListener();

    this._initScene3DDebugMenu();
  }

  _initScene() {
    this._scene = new THREE.Scene();
  }

  _initRenderer() {
    this._windowSizes = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    const canvas = document.querySelector("canvas.webgl");

    const renderer = (this._renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: SCENE_CONFIG.antialias,
    }));

    renderer.setSize(this._windowSizes.width, this._windowSizes.height);
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, SCENE_CONFIG.maxPixelRatio)
    );

    // renderer.useLegacyLights = false;
    // renderer.outputEncoding = THREE.sRGBEncoding;
    // renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // renderer.toneMappingExposure = 1;

    // renderer.shadowMap.enabled = true;
    // renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  _initCamera() {
    const camera = (this._camera = new THREE.PerspectiveCamera(
      50,
      this._windowSizes.width / this._windowSizes.height,
      0.5,
      70
    ));
    this._scene.add(camera);

    camera.position.set(0, 0, 5);
  }

  _initLights() {
    if (GLOBAL_LIGHT_CONFIG.ambient.enabled) {
      const ambientLight = new THREE.AmbientLight(
        GLOBAL_LIGHT_CONFIG.ambient.color,
        GLOBAL_LIGHT_CONFIG.ambient.intensity
      );
      this._scene.add(ambientLight);
    }

    // const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    // directionalLight.position.set(0, 5, 5);
    // this._scene.add(directionalLight);
  }

  _initMaterials() {
    new Materials();
  }

  _initLoadingOverlay() {
    const loadingOverlay = (this._loadingOverlay = new LoadingOverlay());
    this._scene.add(loadingOverlay);
  }

  _initOnResize() {
    window.addEventListener("resize", () => this._onResize());
  }

  _onResize() {
    this._windowSizes.width = window.innerWidth;
    this._windowSizes.height = window.innerHeight;
    const pixelRatio = Math.min(
      window.devicePixelRatio,
      SCENE_CONFIG.maxPixelRatio
    );

    this._camera.aspect = this._windowSizes.width / this._windowSizes.height;
    this._camera.updateProjectionMatrix();

    this._renderer.setSize(this._windowSizes.width, this._windowSizes.height);
    this._renderer.setPixelRatio(pixelRatio);

    if (this._effectComposer) {
      this._effectComposer.setSize(
        this._windowSizes.width,
        this._windowSizes.height
      );
      this._effectComposer.setPixelRatio(pixelRatio);
    }

    if (SCENE_CONFIG.fxaaPass) {
      this._fxaaPass.material.uniforms["resolution"].value.x =
        1 / (this._windowSizes.width * pixelRatio);
      this._fxaaPass.material.uniforms["resolution"].value.y =
        1 / (this._windowSizes.height * pixelRatio);
    }
  }

  _setupBackgroundColor() {
    this._scene.background = new THREE.Color(SCENE_CONFIG.backgroundColor);

    // const texture = Loader.assets['environment'];
    // const renderTarget = new THREE.WebGLCubeRenderTarget(texture.image.height);
    // renderTarget.fromEquirectangularTexture(this._renderer, texture);
    // this._scene.background = renderTarget.texture;
  }

  _initPostProcessing() {
    if (SCENE_CONFIG.isMobile) {
      return;
    }

    this._initEffectsComposer();
    this._initOutlinePass();
    this._initAntiAliasingPass();
  }

  _initEffectsComposer() {
    const pixelRatio = Math.min(
      window.devicePixelRatio,
      SCENE_CONFIG.maxPixelRatio
    );

    if (WebGL.isWebGL2Available() && pixelRatio === 1) {
      const size = this._renderer.getDrawingBufferSize(new THREE.Vector2());
      const target = new THREE.WebGLRenderTarget(size.width, size.height, {
        samples: 3,
      });
      this._effectComposer = new EffectComposer(this._renderer, target);
    } else {
      SCENE_CONFIG.fxaaPass = true;
      this._effectComposer = new EffectComposer(this._renderer);
    }

    const renderPass = (this._renderPass = new RenderPass(
      this._scene,
      this._camera
    ));
    this._effectComposer.addPass(renderPass);
  }

  _initOutlinePass() {
    const bounds = Black.stage.bounds;

    const outlinePass = (this._outlinePass = new OutlinePass(
      new THREE.Vector2(bounds.width, bounds.height),
      this._scene,
      this._camera
    ));
    this._effectComposer.addPass(outlinePass);

    const outlinePassConfig = SCENE_CONFIG.outlinePass;

    outlinePass.visibleEdgeColor.set(outlinePassConfig.color);
    outlinePass.edgeGlow = outlinePassConfig.edgeGlow;
    outlinePass.edgeStrength = outlinePassConfig.edgeStrength;
    outlinePass.edgeThickness = outlinePassConfig.edgeThickness;
    outlinePass.pulsePeriod = outlinePassConfig.pulsePeriod;
  }

  _initAntiAliasingPass() {
    if (SCENE_CONFIG.fxaaPass) {
      const fxaaPass = (this._fxaaPass = new ShaderPass(FXAAShader));
      this._effectComposer.addPass(fxaaPass);

      const pixelRatio = Math.min(
        window.devicePixelRatio,
        SCENE_CONFIG.maxPixelRatio
      );
      fxaaPass.material.uniforms["resolution"].value.x =
        1 / (this._windowSizes.width * pixelRatio);
      fxaaPass.material.uniforms["resolution"].value.y =
        1 / (this._windowSizes.height * pixelRatio);
    }
  }

  _initAudioListener() {
    const audioListener = (this._audioListener = new THREE.AudioListener());
    this._camera.add(audioListener);
  }

  _initScene3DDebugMenu() {
    this._scene3DDebugMenu = new Scene3DDebugMenu(
      this._scene,
      this._camera,
      this._renderer
    );
    this._orbitControls = this._scene3DDebugMenu.getOrbitControls();
  }

  _showTextToLandscape() {
    if (SCENE_CONFIG.isMobile && window.innerWidth < window.innerHeight) {
      const introText = document.querySelector(".rotate-to-landscape");
      introText.innerHTML = "To use cartridges rotate to landscape";

      introText.classList.add("show");

      window.addEventListener("resize", () => {
        if (window.innerWidth > window.innerHeight) {
          introText.classList.add("hide");
        }
      });

      introText.addEventListener("click", () => {
        introText.classList.add("hide");
      });
    }
  }

  _keyboardControls() {
    if (SCENE_CONFIG.isMobile) {
      const keyboardIcon = document.querySelector(".keyboard-icon");
      keyboardIcon.classList.add("hide");
    } else {
      const keyboardIcon = document.querySelector(".keyboard-icon");
      const keyboardShortcuts = document.querySelector(".keyboard-shortcuts");
      keyboardShortcuts.classList.add("fastShow");

      keyboardIcon.addEventListener("click", () => {
        this._isKeyboardShortcutsShown = !this._isKeyboardShortcutsShown;

        if (this._isKeyboardShortcutsShown) {
          keyboardShortcuts.classList.remove("hide");
          keyboardShortcuts.classList.add("show");
        } else {
          keyboardShortcuts.classList.remove("show");
          keyboardShortcuts.classList.add("hide");
        }
      });
      const list = document.createElement("ul");
      keyboardShortcuts.appendChild(list);

      const items = [
        "Arrows, WASD — D-pad",
        "Z, Space — A button",
        "X — B button",
        "Enter — START",
        "Scroll — Zoom",
      ];

      items.forEach((item) => {
        const listItem = document.createElement("li");
        listItem.innerHTML = `${item}`;
        list.appendChild(listItem);
      });
    }
  }

  _initUpdate() {
    const clock = new THREE.Clock(true);

    const update = () => {
      this._scene3DDebugMenu.preUpdate();

      const deltaTime = clock.getDelta();

      if (this._isAssetsLoaded) {
        TWEEN.update();
        this._scene3DDebugMenu.update();

        if (this._mainScene) {
          this._mainScene.update(deltaTime);
        }

        if (SCENE_CONFIG.isMobile || DEBUG_CONFIG.rendererStats) {
          this._renderer.render(this._scene, this._camera);
        } else {
          this._effectComposer.render();
        }
      }

      this._scene3DDebugMenu.postUpdate();
      window.requestAnimationFrame(update);
    };

    update();
  }
}

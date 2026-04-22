// In src/Game/index.ts
import * as THREE from 'three';
import Sizes from './size';
import Environment from './environment';
import Player from './player';
import Renderer from './render';
import Stats from 'stats.js';
import {EventEmitter} from 'events';
import {cache} from '@/Game/utils/model';
import {disposeNode} from './utils/dispose';
import { GameScene } from './scene';
import Camera from './camera';
import Time from './time';

let stats = new Stats();
document.body.appendChild(stats.dom);

export default class Game extends EventEmitter {
    static instance: Game;
    canvas: HTMLElement | undefined;
    sizes!: Sizes;
    time!: Time;
    renderer!: Renderer;
    scene!: THREE.Scene;
    camera!: Camera;
    environment: Environment | undefined;
    player: Player | undefined;
    clock: THREE.Clock = new THREE.Clock();
    windowResizeFn!: (e: Event) => void;
    
    constructor(canvas?: HTMLElement, scorePanel?: any) {
        super();
        if (Game.instance) {
            return Game.instance;
        }
        Game.instance = this;
        this.canvas = canvas;
        
        // Store scorePanel if provided
        if (scorePanel) {
            (this as any).scorePanel = scorePanel;
        }
        
        this.sizes = new Sizes();
        
        this.sizes.on("resize", () => {
            this.resize();
        })
        this.time = new Time();
        
        this.time.on("update", () => {
            this.update();
        })
        
        this.scene = new GameScene().scene;
       
        this.camera = new Camera();
        
        this.renderer = new Renderer();
        
        this.environment = new Environment();
        this.player = Player.getInstance();
        this.resize();
        this.resource();
    }
    
    // Add getInstance method
    public static getInstance(canvas?: HTMLElement, scorePanel?: any): Game {
        if (!Game.instance) {
            if (!canvas) {
                throw new Error('Canvas element is required for first Game initialization');
            }
            Game.instance = new Game(canvas, scorePanel);
        }
        return Game.instance;
    }
    
    update() {
        const delta = this.time.delta / 1000;
        stats.update();
        this.renderer.update();
        this.player?.update && this.player.update(delta);
    }
    
    resource() {
        THREE.DefaultLoadingManager.onLoad = () => {
            this.emit('progress', {type: 'successLoad'});
        };

        THREE.DefaultLoadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
            this.emit('progress', {type: 'onProgress', url: url, itemsLoaded: itemsLoaded, itemsTotal: itemsTotal});
        };

        THREE.DefaultLoadingManager.onError = () => {
            this.emit('progress', {type: 'error'});
        };
    }
    
    removelistener() {
        window.removeEventListener('resize', this.windowResizeFn);
    }
    
    resize() {
        this.renderer.resize();
        this.camera.resize();
    }
    
    disposeGame() {
        cache?.clearCacheData();
        this.removelistener();
        disposeNode(this.scene);
        this.scene.clear();
        this.renderer.dispose();
    }
}
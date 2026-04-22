import { load3DModel } from '@/Game/utils/model';
import * as THREE from 'three';
import Game from '.';
import { playerStatus } from './const';
import { ControlPlayer } from './contorlPlayer';
import { EventEmitter } from 'events';

interface AnimationConfig {
    loop?: THREE.AnimationActionLoopStyles;
    clampWhenFinished?: boolean;
    timeScale?: number;
    frameRange?: { start: number; end: number };
}

export default class Player extends EventEmitter {
    private static instance: Player;
    private playerAnimationMixer: THREE.AnimationMixer | null = null;
    private mixer: THREE.AnimationMixer | null = null;
    private game!: Game;
    private scene!: THREE.Scene;
    private animations: Partial<Record<playerStatus, THREE.AnimationAction>> = {};
    private playerModel: THREE.Group | null = null;
    private camera!: THREE.PerspectiveCamera;
    private controlPlayer: ControlPlayer | null = null;
    private directionalLight: THREE.DirectionalLight | null = null;
    private isColliding: boolean = false;
    private readonly POSITION = {
        Y_OFFSET: 20,
        Z_OFFSET: 5,
        CAMERA_Y_OFFSET: 9,
        CAMERA_Z_OFFSET: 17,
        LOOK_AT_Y_OFFSET: 5.8
    };
    private readonly SCALE = 2.8;
    private readonly COLLISION_DURATION = 300;
    
    // Store initial position for reset
    private initialPosition: THREE.Vector3 = new THREE.Vector3(0, 20, 5);
    private initialRotation: number = Math.PI;

    private constructor() {
        super();
        if (Player.instance) {
            return Player.instance;
        }
        Player.instance = this;
        this.game = new Game();
        this.scene = this.game.scene;
        this.camera = this.game.camera.perspectiveCamera;
        this.initialize();
    }

    public static getInstance(): Player {
        if (!Player.instance) {
            Player.instance = new Player();
        }
        return Player.instance;
    }

    private async initialize(): Promise<void> {
        try {
            await this.createPlayer();
            this.setupLighting();
        } catch (error) {
            console.error('Failed to initialize player:', error);
            throw error;
        }
    }

    private async createPlayer(firstPersonView: boolean = true): Promise<void> {
        const { scene: playerModel, animations = [] } = await load3DModel('/assets/glb/player1.glb');
        
        // Cast to Group since load3DModel returns a Group
        const modelGroup = playerModel as THREE.Group;
        this.configureModelMaterials(modelGroup);
        this.positionModel(modelGroup, firstPersonView);
        
        this.setupAnimationMixers(modelGroup);
        this.processAnimations(animations);
        
        this.playerModel = modelGroup;
        this.scene.add(modelGroup);
        this.createControlPlayer();
    }

    private configureModelMaterials(model: THREE.Group): void {
        model.traverse((child: THREE.Object3D) => {
            if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material) {
                    const material = child.material as THREE.MeshStandardMaterial;
                    material.emissive = material.color;
                    material.emissiveMap = material.map;
                    material.metalness = 0;
                }
            }
        });
    }

    private positionModel(model: THREE.Group, firstPersonView: boolean): void {
        model.position.set(0, this.POSITION.Y_OFFSET, this.POSITION.Z_OFFSET);
        if (firstPersonView) {
            model.rotateY(Math.PI);
        }
        model.scale.set(this.SCALE, this.SCALE, this.SCALE);
    }

    private setupAnimationMixers(model: THREE.Group): void {
        this.playerAnimationMixer = new THREE.AnimationMixer(model);
        this.mixer = new THREE.AnimationMixer(model);
    }

    private processAnimations(animations: THREE.AnimationClip[]): void {
        for (const animation of animations) {
            const actionName = animation.name as playerStatus;
            const config = this.getAnimationConfig(actionName);
            const processedAnimation = this.processAnimationClip(animation, config);
            const action = this.mixer!.clipAction(processedAnimation);
            
            this.applyAnimationConfig(action, config);
            this.animations[actionName] = action;
        }
    }

    private getAnimationConfig(actionName: playerStatus): AnimationConfig {
        const configs: Partial<Record<playerStatus, AnimationConfig>> = {
            [playerStatus.JUMP]: { frameRange: { start: 12, end: 30 }, loop: THREE.LoopOnce, clampWhenFinished: true },
            [playerStatus.RUN]: { timeScale: 1.1 },
            [playerStatus.ROLL]: { frameRange: { start: 0, end: 44 }, loop: THREE.LoopOnce, clampWhenFinished: true, timeScale: 2 },
            [playerStatus.LOOKBACK]: { loop: THREE.LoopOnce, timeScale: 1.8, clampWhenFinished: true },
            [playerStatus.RUNLOOKBACK]: { loop: THREE.LoopOnce, timeScale: 1.8, clampWhenFinished: true },
            [playerStatus.FALL]: { frameRange: { start: 3, end: 12 }, loop: THREE.LoopOnce, timeScale: 0.2 },
            [playerStatus.DIE]: { loop: THREE.LoopOnce, clampWhenFinished: true }
        };
        
        return configs[actionName] || {};
    }

    private processAnimationClip(clip: THREE.AnimationClip, config: AnimationConfig): THREE.AnimationClip {
        if (config.frameRange) {
            return THREE.AnimationUtils.subclip(
                clip, 
                `${clip.name}_processed`, 
                config.frameRange.start, 
                config.frameRange.end
            );
        }
        return clip;
    }

    private applyAnimationConfig(action: THREE.AnimationAction, config: AnimationConfig): void {
        if (config.loop !== undefined) action.loop = config.loop;
        if (config.clampWhenFinished !== undefined) action.clampWhenFinished = config.clampWhenFinished;
        if (config.timeScale !== undefined) action.timeScale = config.timeScale;
    }

    private setupLighting(): void {
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        this.directionalLight.position.set(0, 10, 5);
        this.directionalLight.castShadow = true;
        
        const shadowCamera = this.directionalLight.shadow.camera;
        shadowCamera.near = 0.1;
        shadowCamera.far = 120;
        shadowCamera.left = -20;
        shadowCamera.right = 20;
        shadowCamera.bottom = -20;
        
        this.scene.add(this.directionalLight);
    }

    private createControlPlayer(): void {
        if (!this.playerModel || !this.mixer) return;
        
        this.controlPlayer = new ControlPlayer(
            this.playerModel, 
            this.mixer, 
            'dance', 
            this.animations
        );
        
        this.controlPlayer.on('collision', this.handleCollision.bind(this));
    }

    private handleCollision(): void {
        this.isColliding = true;
        setTimeout(() => {
            this.isColliding = false;
        }, this.COLLISION_DURATION);
    }

    private updateCamera(deltaTime: number): void {
        if (!this.playerModel) return;
        
        const playerPos = this.playerModel.position;
        const targetPosition = new THREE.Vector3(
            playerPos.x,
            playerPos.y + this.POSITION.CAMERA_Y_OFFSET,
            playerPos.z + this.POSITION.CAMERA_Z_OFFSET
        );
        
        const lookAtPoint = new THREE.Vector3(
            playerPos.x,
            playerPos.y + this.POSITION.LOOK_AT_Y_OFFSET,
            playerPos.z
        );
        
        this.camera.position.copy(targetPosition);
        
        if (this.isColliding) {
            this.applyCameraShake(deltaTime);
        }
        
        this.camera.lookAt(lookAtPoint);
    }

    private applyCameraShake(deltaTime: number): void {
        const intensity = Math.sin(deltaTime * Math.PI) * 0.1;
        const shakeOffset = new THREE.Vector3(intensity, 0, 0);
        this.camera.position.add(shakeOffset);
    }

    public update(deltaTime: number): void {
        if (!this.controlPlayer || !this.mixer) return;
        
        // Clamp deltaTime to prevent large jumps
        const clampedDelta = Math.min(deltaTime, 0.033);
        
        this.controlPlayer.update(clampedDelta);
        this.mixer.update(clampedDelta);
        this.updateCamera(clampedDelta);
    }

    public getAnimation(name: playerStatus): THREE.AnimationAction | undefined {
        return this.animations[name];
    }

    public playAnimation(name: playerStatus): void {
        const animation = this.animations[name];
        if (animation) {
            animation.reset().play();
        }
    }

    public stopAnimation(name: playerStatus): void {
        const animation = this.animations[name];
        if (animation) {
            animation.stop();
        }
    }

    public getPlayerPosition(): THREE.Vector3 | null {
        return this.playerModel?.position.clone() || null;
    }

    // FIX: Implement the reset method properly
    public reset(): void {
        if (!this.playerModel) return;
        
        // Reset position
        this.playerModel.position.set(
            this.initialPosition.x,
            this.initialPosition.y,
            this.initialPosition.z
        );
        
        // Reset rotation
        this.playerModel.rotation.set(0, this.initialRotation, 0);
        
        // Reset any active animations
        if (this.mixer) {
            // Stop all current animations
            this.mixer.stopAllAction();
            
            // Reset and play the idle/run animation
            const runAnimation = this.animations[playerStatus.RUN];
            if (runAnimation) {
                runAnimation.reset().play();
            }
        }
        
        // Reset collision state
        this.isColliding = false;
        
        // Reset control player state if it has a reset method
        if (this.controlPlayer && typeof this.controlPlayer.reset === 'function') {
            this.controlPlayer.reset();
        }
        
        console.log('Player position reset to:', this.playerModel.position);
    }

    public dispose(): void {
        if (this.controlPlayer) {
            this.controlPlayer.removeAllListeners();
        }
        
        if (this.mixer) {
            this.mixer.stopAllAction();
        }
        
        if (this.playerModel) {
            this.scene.remove(this.playerModel);
        }
        
        if (this.directionalLight) {
            this.scene.remove(this.directionalLight);
        }
        
        this.removeAllListeners();
    }
}
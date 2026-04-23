import * as THREE from 'three';
import { EventEmitter } from 'events';
import Player from './player';
import { Track } from './track';
import { Coin } from './objects/Coin';
import { Obstacle } from './objects/Obstacle';
import { GAME_STATUS } from './const';

export default class Game extends EventEmitter {
    private static instance: Game;
    private scene!: THREE.Scene;
    private camera!: THREE.PerspectiveCamera;
    private renderer!: THREE.WebGLRenderer;
    private player!: Player;
    private track!: Track;
    private coins: Coin[] = [];
    private obstacles: Obstacle[] = [];
    private gameScore: number = 0;
    private gameMistakes: number = 0;
    private realCoinScore: number = 0;
    private gameRunning: boolean = false;
    private lastTime: number = 0;
    private coinSpawnTimer: number = 0;
    private obstacleSpawnTimer: number = 0;

    private currentDifficultyLevel: number = 1;
    private gameDistance: number = 0;
    private gameSpeed: number = 8;

    private baseCoinSpawnInterval: number = 1.8;
    private baseObstacleSpawnInterval: number = 2.2;
    private currentCoinSpawnInterval: number = 1.8;
    private currentObstacleSpawnInterval: number = 2.2;
    private readonly COIN_VALUE = 10;
    private readonly SCORE_PER_FRAME = 1;

    private readonly DIFFICULTY_CONFIG = {
        SPEED_INCREASE: 0.3,
        SPAWN_REDUCTION: 0.12,
        MAX_SPEED: 25,
        MIN_COIN_INTERVAL: 0.6,
        MIN_OBSTACLE_INTERVAL: 0.8,
        SCORE_PER_LEVEL: 500,
        OBSTACLE_DENSITY_INCREASE: 0.05,
        COIN_DENSITY_DECREASE: 0.03
    };

    private fogDensity: number = 0.02;
    private backgroundColor: THREE.Color = new THREE.Color(0x87CEEB);

    // Singleton pattern - private constructor (no UI dependencies)
    private constructor(canvas?: HTMLCanvasElement) {
        super(); // Call EventEmitter constructor
        console.log('🎮 Game constructor - No UI dependencies');
        
        if (canvas) {
            this.setupScene(canvas);
            this.initPlayer();
            this.initTrack();
            this.setupLights();
            this.setupEventListeners();
            this.initDifficulty();
            this.setupLoadingManager();
        }
    }

    // Static method to get the singleton instance (no UI dependencies)
    public static getInstance(canvas?: HTMLCanvasElement): Game {
        if (!Game.instance) {
            if (!canvas) {
                throw new Error('Canvas element is required for first Game initialization');
            }
            Game.instance = new Game(canvas);
        }
        return Game.instance;
    }

    // Setup loading manager to track asset loading
    private setupLoadingManager(): void {
        THREE.DefaultLoadingManager.onLoad = () => {
            console.log('✅ All assets loaded successfully');
            this.emit('progress', { type: 'successLoad' });
        };

        THREE.DefaultLoadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
            console.log(`📊 Loading: ${url} (${itemsLoaded}/${itemsTotal})`);
            this.emit('progress', { 
                type: 'onProgress', 
                url: url, 
                itemsLoaded: itemsLoaded, 
                itemsTotal: itemsTotal 
            });
        };

        THREE.DefaultLoadingManager.onError = (url) => {
            console.error(`❌ Error loading: ${url}`);
            this.emit('progress', { type: 'error', url: url });
        };
    }

    private initPlayer(): void {
        this.player = Player.getInstance();
    }

    private initTrack(): void {
        this.track = new Track(this.scene);
    }

    private initDifficulty(): void {
        this.currentCoinSpawnInterval = this.baseCoinSpawnInterval;
        this.currentObstacleSpawnInterval = this.baseObstacleSpawnInterval;
        this.gameSpeed = 8;
        this.currentDifficultyLevel = 1;
    }

    private setupScene(canvas: HTMLCanvasElement): void {
        this.scene = new THREE.Scene();
        this.scene.background = this.backgroundColor;
        this.scene.fog = new THREE.FogExp2(0x87CEEB, this.fogDensity);

        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ canvas });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    private setupLights(): void {
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(10, 20, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        this.scene.add(directionalLight);

        const fillLight = new THREE.PointLight(0x4466cc, 0.3);
        fillLight.position.set(0, -5, 0);
        this.scene.add(fillLight);
    }

    private setupEventListeners(): void {
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    private onWindowResize(): void {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    private updateDifficulty(): void {
        const newLevel = Math.floor(this.realCoinScore / this.DIFFICULTY_CONFIG.SCORE_PER_LEVEL) + 1;

        if (newLevel > this.currentDifficultyLevel && newLevel <= 10) {
            this.currentDifficultyLevel = newLevel;
            this.applyDifficultyScaling();
            this.showDifficultyNotification();
        }
    }

    private applyDifficultyScaling(): void {
        this.gameSpeed = Math.min(
            this.DIFFICULTY_CONFIG.MAX_SPEED,
            8 + (this.currentDifficultyLevel - 1) * this.DIFFICULTY_CONFIG.SPEED_INCREASE
        );

        this.currentCoinSpawnInterval = Math.max(
            this.DIFFICULTY_CONFIG.MIN_COIN_INTERVAL,
            this.baseCoinSpawnInterval - (this.currentDifficultyLevel - 1) * this.DIFFICULTY_CONFIG.SPAWN_REDUCTION
        );

        this.currentObstacleSpawnInterval = Math.max(
            this.DIFFICULTY_CONFIG.MIN_OBSTACLE_INTERVAL,
            this.baseObstacleSpawnInterval - (this.currentDifficultyLevel - 1) * this.DIFFICULTY_CONFIG.SPAWN_REDUCTION
        );

        this.updateVisualEffects();

        console.log(`⚡ DIFFICULTY LEVEL ${this.currentDifficultyLevel}!`);
        console.log(`   Speed: ${this.gameSpeed.toFixed(1)}`);
        console.log(`   Coin interval: ${this.currentCoinSpawnInterval.toFixed(2)}s`);
        console.log(`   Obstacle interval: ${this.currentObstacleSpawnInterval.toFixed(2)}s`);
    }

    private updateVisualEffects(): void {
        const intensity = Math.min(0.5, (this.currentDifficultyLevel - 1) * 0.05);
        this.backgroundColor.setHSL(0.55, 0.6, 0.5 - intensity * 0.3);
        this.scene.background = this.backgroundColor;

        this.fogDensity = 0.02 + (this.currentDifficultyLevel - 1) * 0.008;
        this.scene.fog = new THREE.FogExp2(this.backgroundColor, this.fogDensity);

        const lightIntensity = Math.max(0.6, 1 - (this.currentDifficultyLevel - 1) * 0.04);
        const directionalLight = this.scene.children.find(c => c instanceof THREE.DirectionalLight) as THREE.DirectionalLight;
        if (directionalLight) {
            directionalLight.intensity = lightIntensity;
        }
    }

    private showDifficultyNotification(): void {
        const notification = document.createElement('div');
        notification.textContent = `⚡ LEVEL ${this.currentDifficultyLevel} ⚡`;
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #ff4444;
            font-size: ${30 + this.currentDifficultyLevel * 2}px;
            font-weight: bold;
            font-family: Arial, sans-serif;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            z-index: 1000;
            pointer-events: none;
            animation: fadeOutUp 1.5s ease-out forwards;
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeOutUp {
                0%   { opacity: 1; transform: translate(-50%, -50%); }
                100% { opacity: 0; transform: translate(-50%, -150%); }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
            style.remove();
        }, 1500);
    }

    public onCoinCollected(coin: Coin): void {
        if (!this.gameRunning) return;

        console.log('💰 Coin collected!');
        
        const coinValue = this.COIN_VALUE + Math.floor(this.currentDifficultyLevel / 2);

        this.realCoinScore += coinValue;
        this.gameScore += coinValue;

        // ✅ ONLY emit game data - NO UI manipulation
        this.emit('gameData', {
            score: this.gameScore,
            mistake: this.gameMistakes,
            coin: this.realCoinScore
        });

        console.log(`💰 +${coinValue} pts | Total coins: ${this.realCoinScore} | Score: ${this.gameScore}`);

        // Remove coin from scene and tracking array
        const index = this.coins.indexOf(coin);
        if (index > -1) {
            this.coins.splice(index, 1);
        }
        coin.dispose();

        this.createCoinCollectEffect(coin.position);
    }

    public onObstacleHit(obstacle: Obstacle): void {
        if (!this.gameRunning) return;

        const mistakePenalty = Math.max(10, this.gameScore * 0.05 * this.currentDifficultyLevel);
        this.gameScore = Math.max(0, this.gameScore - mistakePenalty);
        this.gameMistakes++;

        // ✅ ONLY emit game data - NO UI manipulation
        this.emit('gameData', {
            score: this.gameScore,
            mistake: this.gameMistakes,
            coin: this.realCoinScore
        });

        const index = this.obstacles.indexOf(obstacle);
        if (index > -1) {
            this.obstacles.splice(index, 1);
        }
        obstacle.dispose();

        this.screenShake();
        this.showHitEffect();

        console.log(`💥 Hit obstacle! Penalty: -${Math.floor(mistakePenalty)} pts | Mistakes: ${this.gameMistakes}`);
    }

    private showHitEffect(): void {
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background-color: rgba(255, 0, 0, 0.3);
            pointer-events: none;
            z-index: 999;
            animation: flash 0.2s ease-out forwards;
        `;

        const style = document.createElement('style');
        style.textContent = `@keyframes flash { 0% { opacity:1; } 100% { opacity:0; } }`;
        document.head.appendChild(style);
        document.body.appendChild(flash);

        setTimeout(() => { flash.remove(); style.remove(); }, 200);
    }

    private createCoinCollectEffect(position: THREE.Vector3): void {
        const particleCount = 10 + Math.floor(this.currentDifficultyLevel / 2);
        const particles: THREE.Mesh[] = [];

        for (let i = 0; i < particleCount; i++) {
            const geometry = new THREE.SphereGeometry(0.1, 4, 4);
            const material = new THREE.MeshStandardMaterial({ color: 0xffaa00 });
            const particle = new THREE.Mesh(geometry, material);
            particle.position.copy(position);
            particle.userData = {
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 2,
                    Math.random() * 2,
                    (Math.random() - 0.5) * 2
                ),
                life: 1
            };
            this.scene.add(particle);
            particles.push(particle);
        }

        const animateParticles = () => {
            let allDead = true;
            particles.forEach(particle => {
                if (particle.userData.life > 0) {
                    allDead = false;
                    particle.userData.life -= 0.05;
                    particle.position.addScaledVector(particle.userData.velocity, 0.1);
                    const mat = particle.material as THREE.MeshStandardMaterial;
                    mat.opacity = particle.userData.life;
                    mat.transparent = true;
                } else {
                    this.scene.remove(particle);
                }
            });
            if (!allDead) requestAnimationFrame(animateParticles);
        };

        animateParticles();
    }

    private screenShake(): void {
        const originalPosition = this.camera.position.clone();
        const shakeDuration = 0.2;
        const shakeIntensity = 0.3 + (this.currentDifficultyLevel - 1) * 0.05;
        const startTime = performance.now() / 1000;

        const shake = () => {
            const elapsed = performance.now() / 1000 - startTime;
            if (elapsed < shakeDuration) {
                const intensity = shakeIntensity * (1 - elapsed / shakeDuration);
                this.camera.position.x = originalPosition.x + (Math.random() - 0.5) * intensity;
                this.camera.position.y = originalPosition.y + (Math.random() - 0.5) * intensity;
                requestAnimationFrame(shake);
            } else {
                this.camera.position.copy(originalPosition);
            }
        };

        shake();
    }

    private spawnCoin(): void {
        const x = (Math.random() - 0.5) * 20;
        const coin = new Coin(x, 1, -30);
        this.scene.add(coin.mesh);
        this.coins.push(coin);
    }

    private spawnObstacle(): void {
        const obstacleCount = Math.min(3, Math.floor(this.currentDifficultyLevel / 3) + 1);

        for (let i = 0; i < obstacleCount; i++) {
            const offset = (i - (obstacleCount - 1) / 2) * 2.5;
            const x = offset + (Math.random() - 0.5) * 2;
            const z = -30 + (i * 2);
            const obstacle = new Obstacle(x, 0, z);
            this.scene.add(obstacle.mesh);
            this.obstacles.push(obstacle);
        }
    }

    private updateGameScore(deltaTime: number): void {
        const scoreMultiplier = 1 + (this.currentDifficultyLevel - 1) * 0.1;
        this.gameScore += this.SCORE_PER_FRAME * deltaTime * scoreMultiplier;
        this.gameDistance += this.gameSpeed * deltaTime;
        
        // ✅ Emit game data for UI updates
        this.emit('gameData', {
            score: this.gameScore,
            mistake: this.gameMistakes,
            coin: this.realCoinScore
        });
    }

    private checkCollisions(): void {
        const playerPosition = this.player.getPlayerPosition();
        if (!playerPosition) return;

        // Check coin collisions
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            if (coin.checkCollision(playerPosition)) {
                this.onCoinCollected(coin);
                break; // Only collect one coin per frame to avoid multiple collections
            }
        }

        // Check obstacle collisions
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            if (obstacle.checkCollision(playerPosition)) {
                this.onObstacleHit(obstacle);
                break; // Only hit one obstacle per frame
            }
        }
    }

    private updateObjects(deltaTime: number): void {
        const speed = this.gameSpeed * deltaTime;

        this.coins = this.coins.filter(coin => {
            coin.update(speed);
            if (coin.position.z > 10) {
                coin.dispose();
                return false;
            }
            return true;
        });

        this.obstacles = this.obstacles.filter(obstacle => {
            obstacle.update(speed);
            if (obstacle.position.z > 10) {
                obstacle.dispose();
                return false;
            }
            return true;
        });
    }

    private updateSpawners(deltaTime: number): void {
        this.coinSpawnTimer += deltaTime;
        if (this.coinSpawnTimer >= this.currentCoinSpawnInterval) {
            this.spawnCoin();
            this.coinSpawnTimer = 0;
        }

        this.obstacleSpawnTimer += deltaTime;
        if (this.obstacleSpawnTimer >= this.currentObstacleSpawnInterval) {
            this.spawnObstacle();
            this.obstacleSpawnTimer = 0;
        }
    }

    public update(currentTime: number): void {
        if (!this.gameRunning) return;

        let deltaTime = (currentTime - this.lastTime) / 1000;
        deltaTime = Math.min(deltaTime, 0.033);
        this.lastTime = currentTime;

        this.player.update(deltaTime);
        this.updateObjects(deltaTime);
        this.updateSpawners(deltaTime);
        this.updateGameScore(deltaTime);
        this.checkCollisions();
        this.updateDifficulty();

        const playerPos = this.player.getPlayerPosition();
        if (playerPos) {
            this.camera.position.x = playerPos.x;
            this.camera.position.z = playerPos.z + 5;
        }

        this.renderer.render(this.scene, this.camera);
    }

    public start(): void {
        console.log('🎮 Game starting - Resetting all values');
        
        // Reset all game state
        this.gameScore = 0;
        this.gameMistakes = 0;
        this.realCoinScore = 0;
        this.gameDistance = 0;
        this.coinSpawnTimer = 0;
        this.obstacleSpawnTimer = 0;

        // Clear any leftover coins/obstacles from previous run
        this.coins.forEach(c => c.dispose());
        this.coins = [];
        this.obstacles.forEach(o => o.dispose());
        this.obstacles = [];

        // ✅ NO UI manipulation - just emit events
        this.gameRunning = true;
        this.lastTime = performance.now();
        this.initDifficulty();

        // Emit game status for UI to handle
        this.emit('gameStatus', GAME_STATUS.START);

        console.log('🎮 Game started! All scores reset.');
    }

    public pause(): void {
        this.gameRunning = false;
        console.log('⏸️ Game paused');
        this.emit('gameStatus', GAME_STATUS.PAUSE);
    }

    public resume(): void {
        this.gameRunning = true;
        this.lastTime = performance.now();
        console.log('▶️ Game resumed');
        this.emit('gameStatus', GAME_STATUS.START);
    }

    public getScore(): number {
        return Math.floor(this.gameScore);
    }

    public getCoinScore(): number {
        return this.realCoinScore;
    }

    public getMistakes(): number {
        return this.gameMistakes;
    }

    public getDifficulty(): number {
        return this.currentDifficultyLevel;
    }

    public getGameSpeed(): number {
        return this.gameSpeed;
    }

    public disposeGame(): void {
        this.gameRunning = false;
        window.removeEventListener('resize', this.onWindowResize.bind(this));
        this.coins.forEach(coin => coin.dispose());
        this.obstacles.forEach(obstacle => obstacle.dispose());
        this.renderer.dispose();
        console.log('🗑️ Game disposed');
    }
}
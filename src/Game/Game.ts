import * as THREE from 'three';
import Player from './player';
import { Track } from './track';
import { Coin } from './objects/coin';
import { Obstacle } from './objects/obstacle';
import type ScorePanel from '@/components/ScorePanel.vue';

export default class Game {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private player: Player;
    private track: Track;
    private coins: Coin[] = [];
    private obstacles: Obstacle[] = [];
    private scorePanel: any; // Reference to ScorePanel component
    private gameScore: number = 0;
    private gameMistakes: number = 0;
    private gameRunning: boolean = true;
    private lastTime: number = 0;
    private coinSpawnTimer: number = 0;
    private obstacleSpawnTimer: number = 0;
    
    // Game settings
    private readonly COIN_SPAWN_INTERVAL = 1.5; // seconds
    private readonly OBSTACLE_SPAWN_INTERVAL = 2; // seconds
    private readonly COIN_VALUE = 10;
    private readonly SCORE_PER_FRAME = 1;
    
    constructor(canvas: HTMLCanvasElement, scorePanelComponent: any) {
        this.scorePanel = scorePanelComponent;
        this.setupScene(canvas);
        this.player = new Player();
        this.track = new Track();
        this.setupLights();
        this.setupEventListeners();
    }
    
    private setupScene(canvas: HTMLCanvasElement): void {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 100);
        
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
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(10, 20, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        this.scene.add(directionalLight);
        
        // Fill light from below
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
    
    // REAL coin collection - called when player collides with coin
    public onCoinCollected(coin: Coin): void {
        if (!this.gameRunning) return;
        
        // Add to game score
        this.gameScore += this.COIN_VALUE;
        
        // Add REAL coin to the ScorePanel
        if (this.scorePanel) {
            this.scorePanel.addCoins(1); // Add 1 real coin
            console.log(`💰 Coin collected! Total coins: ${this.scorePanel.getCoinCount()}`);
        }
        
        // Remove coin from scene
        const index = this.coins.indexOf(coin);
        if (index > -1) {
            this.coins.splice(index, 1);
        }
        coin.dispose();
        
        // Visual feedback
        this.createCoinCollectEffect(coin.position);
        
        // Play coin sound (if you have sound)
        // this.playCoinSound();
    }
    
    // Called when player hits obstacle
    public onObstacleHit(obstacle: Obstacle): void {
        if (!this.gameRunning) return;
        
        this.gameMistakes++;
        
        // Update mistake count in ScorePanel if needed
        // this.scorePanel.updateMistakes(this.gameMistakes);
        
        // Remove obstacle
        const index = this.obstacles.indexOf(obstacle);
        if (index > -1) {
            this.obstacles.splice(index, 1);
        }
        obstacle.dispose();
        
        // Screen shake effect
        this.screenShake();
        
        console.log(`💥 Hit obstacle! Mistakes: ${this.gameMistakes}`);
    }
    
    private createCoinCollectEffect(position: THREE.Vector3): void {
        // Create particle effect for coin collection
        const particleCount = 10;
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
        
        // Animate particles
        const animateParticles = () => {
            let allDead = true;
            particles.forEach(particle => {
                if (particle.userData.life > 0) {
                    allDead = false;
                    particle.userData.life -= 0.05;
                    particle.position.x += particle.userData.velocity.x * 0.1;
                    particle.position.y += particle.userData.velocity.y * 0.1;
                    particle.position.z += particle.userData.velocity.z * 0.1;
                    (particle.material as THREE.MeshStandardMaterial).opacity = particle.userData.life;
                    particle.material.transparent = true;
                } else {
                    this.scene.remove(particle);
                }
            });
            
            if (!allDead) {
                requestAnimationFrame(animateParticles);
            }
        };
        
        animateParticles();
    }
    
    private screenShake(): void {
        const originalPosition = this.camera.position.clone();
        let shakeDuration = 0.2;
        const shakeIntensity = 0.3;
        const startTime = performance.now() / 1000;
        
        const shake = () => {
            const currentTime = performance.now() / 1000;
            const elapsed = currentTime - startTime;
            
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
        const z = -30;
        const coin = new Coin(x, 1, z);
        this.scene.add(coin.mesh);
        this.coins.push(coin);
    }
    
    private spawnObstacle(): void {
        const x = (Math.random() - 0.5) * 15;
        const z = -30;
        const obstacle = new Obstacle(x, 0, z);
        this.scene.add(obstacle.mesh);
        this.obstacles.push(obstacle);
    }
    
    private updateGameScore(deltaTime: number): void {
        this.gameScore += this.SCORE_PER_FRAME * deltaTime;
        // Update ScorePanel score if needed
        // this.scorePanel.updateScore(Math.floor(this.gameScore));
    }
    
    private checkCollisions(): void {
        const playerPosition = this.player.getPlayerPosition();
        if (!playerPosition) return;
        
        // Check coin collisions
        this.coins.forEach(coin => {
            if (coin.checkCollision(playerPosition)) {
                this.onCoinCollected(coin);
            }
        });
        
        // Check obstacle collisions
        this.obstacles.forEach(obstacle => {
            if (obstacle.checkCollision(playerPosition)) {
                this.onObstacleHit(obstacle);
            }
        });
    }
    
    private updateObjects(deltaTime: number): void {
        const speed = 10 * deltaTime;
        
        // Move coins
        this.coins.forEach(coin => {
            coin.update(speed);
            if (coin.position.z > 10) {
                coin.dispose();
                this.coins = this.coins.filter(c => c !== coin);
            }
        });
        
        // Move obstacles
        this.obstacles.forEach(obstacle => {
            obstacle.update(speed);
            if (obstacle.position.z > 10) {
                obstacle.dispose();
                this.obstacles = this.obstacles.filter(o => o !== obstacle);
            }
        });
    }
    
    private updateSpawners(deltaTime: number): void {
        this.coinSpawnTimer += deltaTime;
        if (this.coinSpawnTimer >= this.COIN_SPAWN_INTERVAL) {
            this.spawnCoin();
            this.coinSpawnTimer = 0;
        }
        
        this.obstacleSpawnTimer += deltaTime;
        if (this.obstacleSpawnTimer >= this.OBSTACLE_SPAWN_INTERVAL) {
            this.spawnObstacle();
            this.obstacleSpawnTimer = 0;
        }
    }
    
    public update(currentTime: number): void {
        if (!this.gameRunning) return;
        
        let deltaTime = (currentTime - this.lastTime) / 1000;
        deltaTime = Math.min(deltaTime, 0.033); // Cap delta time
        this.lastTime = currentTime;
        
        this.player.update(deltaTime);
        this.updateObjects(deltaTime);
        this.updateSpawners(deltaTime);
        this.updateGameScore(deltaTime);
        this.checkCollisions();
        
        // Update camera to follow player
        const playerPos = this.player.getPlayerPosition();
        if (playerPos) {
            this.camera.position.x = playerPos.x;
            this.camera.position.z = playerPos.z + 5;
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    public start(): void {
        this.gameRunning = true;
        this.lastTime = performance.now();
        console.log('Game started!');
    }
    
    public pause(): void {
        this.gameRunning = false;
        console.log('Game paused');
    }
    
    public resume(): void {
        this.gameRunning = true;
        this.lastTime = performance.now();
        console.log('Game resumed');
    }
    
    public getScore(): number {
        return Math.floor(this.gameScore);
    }
    
    public getMistakes(): number {
        return this.gameMistakes;
    }
    
    public dispose(): void {
        this.gameRunning = false;
        window.removeEventListener('resize', this.onWindowResize.bind(this));
        
        this.coins.forEach(coin => coin.dispose());
        this.obstacles.forEach(obstacle => obstacle.dispose());
        
        this.renderer.dispose();
    }
}
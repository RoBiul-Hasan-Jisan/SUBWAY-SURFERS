import Game from '.';
import * as THREE from 'three';
import {textureload, load3DModel} from '@/Game/utils/model';
import {shuffleArray} from '@/Game/utils/random';

export const roadWidth = 15;
export const roadLength = 330;
const threeRoad = [-roadWidth / 3, 0, roadWidth / 3];

const [house1SceneX, house1SceneY, house1RightRotation] = [roadWidth * 1.9, 0, Math.PI];
const [house2SceneX, house2SceneY, house2RightRotation] = [roadWidth * 1.6, 0, Math.PI];
const [house3SceneX, house3SceneY, house3RightRotation] = [roadWidth * 1.08, 10, Math.PI / 2];
const [house4SceneX, house4SceneY, house4RightRotation] = [roadWidth * 1.5, 0, Math.PI];
const [house5SceneX, house5SceneY, house5RightRotation] = [roadWidth * 1.2, 0, Math.PI];

// ── Moving obstacle descriptor ────────────────────────────────────────────────
interface MovingObstacle {
    mesh: THREE.Object3D;
    // 'slide'  = moves left↔right across lanes
    // 'charge' = moves toward the player along Z
    type: 'slide' | 'charge';
    lane: number;           // current lane index 0-2 (for 'slide')
    speed: number;          // units/sec
    direction: number;      // +1 or -1
    z: number;              // world-Z spawn position (fixed for 'slide')
    minX: number;
    maxX: number;
}

export default class Environment {
    static instance: Environment;
    game!: Game;
    scene: THREE.Scene = new THREE.Scene();
    planeGroup: THREE.Group = new THREE.Group();
    plane: THREE.Object3D[] = [];
    obstacal: THREE.Object3D[] = [];
    coin: THREE.Object3D[] = [];
    z!: number;
    house1Scene: any;
    house2Scene: any;
    house3Scene: any;
    house4Scene: any;
    house5Scene: any;

    // ── moving obstacles ──────────────────────────────────────────────────────
    private movingObstacles: MovingObstacle[] = [];
    private trainTemplate: THREE.Object3D | null = null;
    private kerbTemplate: THREE.Object3D | null = null;

    // difficulty state (synced from game.ts via setDifficulty)
    private difficultyLevel: number = 1;
    private gameSpeed: number = 8;

    constructor() {
        if (Environment.instance) {
            return Environment.instance;
        }
        Environment.instance = this;
        this.game = new Game();
        this.scene = this.game.scene;
        this.z = -1 * (roadLength / 2) + 10;
        this.startGame();
    }

    // ── public API called from game.ts ────────────────────────────────────────

    /** Call once per frame from game.ts → update() */
    public update(deltaTime: number): void {
        this.updateMovingObstacles(deltaTime);
    }

    /** Let game.ts push the current difficulty so speeds scale automatically */
    public setDifficulty(level: number, speed: number): void {
        this.difficultyLevel = level;
        this.gameSpeed = speed;
    }

    // ── init ──────────────────────────────────────────────────────────────────

    startGame() {
        this.plane = [];
        this.obstacal = [];
        this.movingObstacles = [];
        this.z = -1 * (roadLength / 2) + 10;
        this.coin = [];
        this.setAmbientLight();
        this.setGroupScene(this.z, -5, true);
    }

    setGroupScene(z: number, houseZ: number, isloadAgain: boolean) {
        const modelGroup = new THREE.Group();
        this.setPlane(modelGroup, z);
        this.loadmodelAndSize(modelGroup, houseZ, isloadAgain);
        this.loadObstacle(modelGroup, houseZ);
        this.scene.add(modelGroup);
    }

    setAmbientLight() {
        const ambientLight = new THREE.AmbientLight(0xffffff);
        ambientLight.position.set(0, 10, 0);
        this.scene.add(ambientLight);
    }

    // ── moving obstacle logic ─────────────────────────────────────────────────

    private updateMovingObstacles(dt: number): void {
        for (const obs of this.movingObstacles) {
            if (obs.type === 'slide') {
                // slide across lanes, bounce at edges
                const slideSpeed = obs.speed * (1 + (this.difficultyLevel - 1) * 0.15);
                obs.mesh.position.x += obs.direction * slideSpeed * dt;

                if (obs.mesh.position.x >= obs.maxX) {
                    obs.mesh.position.x = obs.maxX;
                    obs.direction = -1;
                }
                else if (obs.mesh.position.x <= obs.minX) {
                    obs.mesh.position.x = obs.minX;
                    obs.direction = 1;
                }
            }
            else if (obs.type === 'charge') {
                // charge toward player; respawn behind when it passes
                const chargeSpeed = obs.speed * (1 + (this.difficultyLevel - 1) * 0.2);
                obs.mesh.position.z += chargeSpeed * dt;

                if (obs.mesh.position.z > 20) {
                    // respawn further back, randomise lane
                    const lane = Math.floor(Math.random() * 3);
                    obs.mesh.position.set(threeRoad[lane], 0, -roadLength * 0.4);
                }
            }
        }
    }

    /** Spawn a set of moving obstacles scaled to current difficulty */
    private spawnMovingObstacles(modelGroup: THREE.Group, houseZ: number): void {
        if (!this.trainTemplate || !this.kerbTemplate) return;

        // number of sliding obstacles grows with level
        const slideCount = Math.min(2 + Math.floor(this.difficultyLevel / 2), 6);
        // number of charging obstacles
        const chargeCount = Math.min(Math.floor(this.difficultyLevel / 3), 3);

        // ── sliding kerb-stone barriers ──────────────────────────────────────
        const zStep = roadLength / (slideCount + 1);
        for (let i = 0; i < slideCount; i++) {
            const mesh = this.kerbTemplate.clone();
            mesh.scale.set(1.7, 3.5, 6);
            mesh.traverse((child: any) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.material = child.material.clone();
                    child.material.emissive = child.material.color;
                    child.material.emissiveMap = child.material.map;
                    child.material.metalness = 0;
                }
            });
            const spawnZ = houseZ - zStep * (i + 1);
            // alternate starting side so they're not all in sync
            const startX = i % 2 === 0 ? threeRoad[0] : threeRoad[2];
            mesh.position.set(startX, 0, spawnZ);
            mesh.rotateY(Math.PI);
            modelGroup.add(mesh);

            const obs: MovingObstacle = {
                mesh,
                type: 'slide',
                lane: i % 2 === 0 ? 0 : 2,
                speed: 3 + Math.random() * 2,          // 3–5 u/s base
                direction: i % 2 === 0 ? 1 : -1,
                z: spawnZ,
                minX: threeRoad[0] - 0.5,
                maxX: threeRoad[2] + 0.5,
            };
            this.movingObstacles.push(obs);
        }

        // ── charging trains ───────────────────────────────────────────────────
        for (let i = 0; i < chargeCount; i++) {
            const mesh = this.trainTemplate.clone();
            mesh.scale.set(0.3, 0.3, 0.3);
            mesh.traverse((child: any) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.material = child.material.clone();
                }
            });
            const lane = Math.floor(Math.random() * 3);
            // stagger spawn positions so they don't all arrive together
            mesh.position.set(threeRoad[lane], 0, houseZ - 40 - i * 60);
            modelGroup.add(mesh);

            const obs: MovingObstacle = {
                mesh,
                type: 'charge',
                lane,
                speed: 6 + i * 2 + (this.difficultyLevel - 1) * 1.5,
                direction: 1,
                z: houseZ - 40 - i * 60,
                minX: threeRoad[0],
                maxX: threeRoad[2],
            };
            this.movingObstacles.push(obs);
        }
    }

    // ── obstacle + coin placement ─────────────────────────────────────────────

    async loadObstacle(modelGroup: THREE.Group, houseZ: number) {
        const obstacalGroup = new THREE.Group();
        const sceneGroup = new THREE.Group();

        const [
            {scene: train},
            {scene: kerbStone},
            {scene: coin},
        ] = await Promise.all([
            load3DModel('/assets/glb/train.glb'),
            load3DModel('/assets/glb/kerb_stone.glb'),
            load3DModel('/assets/glb/coin.glb'),
        ]);

        this.setThingName(train, 'train');
        this.setThingName(kerbStone, 'kerbStone');

        // store templates for moving obstacles
        this.trainTemplate = train;
        this.kerbTemplate = kerbStone;

        const planGeometry  = new THREE.PlaneGeometry(5, 10);
        const planGeometry1 = new THREE.PlaneGeometry(5, 19);
        const planGeometry2 = new THREE.PlaneGeometry(5, 18);
        const planMaterial  = new THREE.MeshPhongMaterial({ opacity: 0, transparent: true });

        train.scale.set(0.3, 0.3, 0.3);
        const trainSizeZ = this.comupteBox(train).z;

        // ── HARDER: denser static train placement ────────────────────────────
        // gap shrinks with difficulty: 20 → 10 at level 10
        const trainGap = Math.max(10, 20 - this.difficultyLevel * 1.0);
        let obstacle = houseZ - 20;
        let i = -1, increase = true;

        while (obstacle > houseZ - roadLength) {
            this.advanceLane(i, increase, (ni, ni2) => { i = ni; increase = ni2; });
            this.cloneModel(train, threeRoad[i], 0, obstacle, Math.PI, obstacalGroup);

            const p  = new THREE.Mesh(planGeometry1, planMaterial);
            const p1 = new THREE.Mesh(planGeometry2, planMaterial);
            p1.rotation.x = -Math.PI / 2;
            p.position.set(threeRoad[i], 0, obstacle + 8);
            p1.position.set(threeRoad[i], 8.4, obstacle);
            p.name = p1.name = 'train';
            obstacalGroup.add(p, p1);

            obstacle -= (trainSizeZ + trainGap);
        }

        // ── HARDER: denser kerb placement ────────────────────────────────────
        const kerbScene = kerbStone.clone();
        kerbScene.scale.set(1.7, 3.5, 6);
        kerbScene.traverse((child: any) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.material.emissive = child.material.color;
                child.material.emissiveMap = child.material.map;
                child.material.metalness = 0;
            }
        });
        const blockZ = this.comupteBox(kerbScene).z;
        // HARDER: gap shrinks with level, and at higher levels place 2 kerbs side by side
        const kerbGap = Math.max(12, 25 - this.difficultyLevel * 1.2);

        let obstacleBlock = houseZ - 10;
        let j = -1, increase1 = true;

        while (obstacleBlock > houseZ - roadLength) {
            this.advanceLane(j, increase1, (nj, nj2) => { j = nj; increase1 = nj2; });
            this.cloneModel(kerbScene, threeRoad[j], 0, obstacleBlock, Math.PI, obstacalGroup);

            // HARDER: at level 4+ occasionally block 2 adjacent lanes at once
            if (this.difficultyLevel >= 4 && Math.random() < 0.35) {
                const adjacent = (j + 1) % 3;
                this.cloneModel(kerbScene, threeRoad[adjacent], 0, obstacleBlock, Math.PI, obstacalGroup);
                const pAdj = new THREE.Mesh(planGeometry, planMaterial);
                pAdj.name = 'kerbStone';
                pAdj.position.set(threeRoad[adjacent], 0, obstacleBlock);
                obstacalGroup.add(pAdj);
            }

            const pk = new THREE.Mesh(planGeometry, planMaterial);
            pk.name = 'kerbStone';
            pk.position.set(threeRoad[j], 0, obstacleBlock);
            obstacalGroup.add(pk);

            obstacleBlock -= (blockZ + kerbGap);
        }

        // ── coin placement: denser rows at higher levels ──────────────────────
        coin.scale.set(10, 10, 10);
        coin.traverse((child: any) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.material.emissive = child.material.color;
                child.material.emissiveMap = child.material.map;
                child.material.metalness = 0;
            }
        });
        this.setThingName(coin, 'coin');

        // HARDER: minimum gap shrinks so coins are harder to collect safely
        const coinMinGap = Math.max(2, 5 - Math.floor(this.difficultyLevel / 2));
        const coinMaxGap = Math.max(3, 8 - Math.floor(this.difficultyLevel / 3));

        let coinBlock = houseZ - 5;
        let z = -1, increase2 = true;

        while (coinBlock > houseZ - roadLength) {
            this.advanceLane(z, increase2, (nz, nz2) => { z = nz; increase2 = nz2; });
            this.cloneModel(coin, threeRoad[z], 1.5, coinBlock, Math.PI, sceneGroup);

            // HARDER: at higher levels place coins in a row of 3 (force player into lane)
            if (this.difficultyLevel >= 5 && Math.random() < 0.4) {
                for (let row = 1; row <= 2; row++) {
                    this.cloneModel(coin, threeRoad[z], 1.5, coinBlock - row * 2, Math.PI, sceneGroup);
                }
                coinBlock -= 4; // skip ahead so we don't double-count
            }

            const gap = Math.floor(Math.random() * (coinMaxGap - coinMinGap + 1)) + coinMinGap;
            coinBlock -= gap;
        }

        this.obstacal.push(obstacalGroup);
        this.coin.push(sceneGroup);
        modelGroup.add(obstacalGroup, sceneGroup);

        // spawn moving obstacles on top of static ones
        this.spawnMovingObstacles(modelGroup, houseZ);
    }

    // ── helper: advance lane index in zigzag pattern ──────────────────────────
    private advanceLane(
        i: number,
        increase: boolean,
        set: (i: number, inc: boolean) => void
    ): void {
        if (i >= -1 && i < 2 && increase) {
            set(i + 1, true);
        } else if (i === 2) {
            set(i - 1, false);
        } else if (!increase) {
            if (i - 1 === -1) set(-1, true);
            else set(i - 1, false);
        }
    }

    // ── plane ─────────────────────────────────────────────────────────────────

    async setPlane(modelGroup: THREE.Group, z: number) {
        this.planeGroup = new THREE.Group();
        const [planeTexure, planeTexure1] = await Promise.all([
            textureload('/assets/png/railway_texture.png'),
            textureload('/assets/png/stone.png'),
        ]);
        planeTexure.colorSpace = THREE.SRGBColorSpace;
        planeTexure.rotation = -Math.PI / 2;
        planeTexure.wrapS = THREE.RepeatWrapping;
        planeTexure.wrapT = THREE.RepeatWrapping;
        planeTexure.repeat.set(roadWidth * 3, 3);

        const planGeometry = new THREE.PlaneGeometry(roadWidth, roadLength, 1, 1);
        const planMaterial = new THREE.MeshPhongMaterial({ map: planeTexure });
        const plane = new THREE.Mesh(planGeometry, planMaterial);
        plane.name = 'plane';
        plane.rotation.x = -Math.PI / 2;
        plane.position.set(0, 0, z);
        plane.receiveShadow = true;
        plane.castShadow = true;
        this.plane.push(plane);

        planeTexure1.rotation = -Math.PI / 2;
        planeTexure1.wrapS = THREE.RepeatWrapping;
        planeTexure1.wrapT = THREE.RepeatWrapping;
        planeTexure1.repeat.set(120, 30);

        const planGeometry1 = new THREE.PlaneGeometry(60, roadLength);
        const planMaterial1 = new THREE.MeshBasicMaterial({ map: planeTexure1 });
        const plane1 = new THREE.Mesh(planGeometry1, planMaterial1);
        plane1.rotation.x = -Math.PI / 2;
        plane1.position.set(0, -0.01, z);

        modelGroup.add(plane);
        modelGroup.add(plane1);
    }

    // ── houses ────────────────────────────────────────────────────────────────

    async loadmodelAndSize(modelGroup: THREE.Group, houseZ: number, load: boolean) {
        if (load) {
            const [
                {scene: house1Scene},
                {scene: house2Scene},
                {scene: house3Scene},
                {scene: house4Scene},
                {scene: house5Scene},
            ] = await Promise.all([
                load3DModel('/assets/glb/house1.glb'),
                load3DModel('/assets/glb/house2.glb'),
                load3DModel('/assets/glb/house3.glb'),
                load3DModel('/assets/glb/house4.glb'),
                load3DModel('/assets/glb/house5.glb'),
            ]);
            this.house1Scene = house1Scene;
            this.house2Scene = house2Scene;
            this.house3Scene = house3Scene;
            this.house4Scene = house4Scene;
            this.house5Scene = house5Scene;
        }

        const house1Scene = this.house1Scene.clone();
        const house2Scene = this.house2Scene.clone();
        const house3Scene = this.house3Scene.clone();
        const house4Scene = this.house4Scene.clone();
        const house5Scene = this.house5Scene.clone();

        house1Scene.scale.set(0.03, 0.03, 0.02);
        house1Scene.traverse((child: any) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.material.emissive = child.material.color;
                child.material.emissiveMap = child.material.map;
            }
        });
        house1Scene.rotateY(-Math.PI / 2);
        house1Scene.position.set(roadWidth * 1.8, 0, houseZ - 5);
        const house1Size = this.comupteBox(house1Scene);

        house2Scene.traverse((child: any) => {
            if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; }
        });
        house2Scene.scale.set(3, 3, 2);
        house2Scene.rotateY(Math.PI / 2);
        house2Scene.position.set(-roadWidth * 1.575, 0, houseZ - 10);
        const house2Size = this.comupteBox(house2Scene);

        house3Scene.scale.set(10, 10, 8);
        house3Scene.rotateY(Math.PI);
        const house3Size = this.comupteBox(house3Scene);

        house4Scene.traverse((child: any) => {
            if (child.isMesh) {
                child.castShadow = true; child.receiveShadow = true;
                child.material.emissive = child.material.color;
                child.material.emissiveMap = child.material.map;
            }
        });
        house4Scene.rotateY(Math.PI);
        house4Scene.scale.set(11, 11, 10);
        house4Scene.position.set(-roadWidth * 1.43, 0, houseZ - 35);
        const house4Size = this.comupteBox(house4Scene);

        house5Scene.traverse((child: any) => {
            if (child.isMesh) {
                child.castShadow = true; child.receiveShadow = true;
                child.material.emissive = child.material.color;
                child.material.emissiveMap = child.material.map;
            }
        });
        house5Scene.scale.set(0.1, 0.08, 0.1);
        house5Scene.rotateY(-Math.PI);
        house5Scene.position.set(roadWidth * 1.16, 0, houseZ - 35);
        const house5Size = this.comupteBox(house5Scene);

        const randomArray = [
            {name: 'house1Scene', scene: house1Scene},
            {name: 'house2Scene', scene: house2Scene},
            {name: 'house3Scene', scene: house3Scene},
            {name: 'house4Scene', scene: house4Scene},
            {name: 'house5Scene', scene: house5Scene},
        ];
        const sceneMap: any = {
            house1Scene: house1Size,
            house2Scene: house2Size,
            house3Scene: house3Size,
            house4Scene: house4Size,
            house5Scene: house5Size,
        };

        const placeHouses = (startX: number, rotation: (name: string) => number) => {
            let pos = houseZ;
            let n = 0;
            while (pos > houseZ - roadLength) {
                const {name, scene} = shuffleArray(randomArray)[3];
                const size = sceneMap[name];
                if (n !== 0) pos -= Math.abs(size.z);

                const xMap: any = {
                    house1Scene: startX > 0 ? house1SceneX : -house1SceneX,
                    house2Scene: startX > 0 ? house2SceneX : -house2SceneX,
                    house3Scene: startX > 0 ? house3SceneX : -house3SceneX,
                    house4Scene: startX > 0 ? house4SceneX : -house4SceneX,
                    house5Scene: startX > 0 ? house5SceneX : -house5SceneX,
                };
                const yMap: any = {
                    house1Scene: house1SceneY,
                    house2Scene: house2SceneY,
                    house3Scene: house3SceneY,
                    house4Scene: house4SceneY,
                    house5Scene: house5SceneY,
                };
                this.cloneModel(scene, xMap[name], yMap[name], pos, rotation(name), modelGroup);
                n++;
                pos -= Math.abs(size.z) - 20;
            }
        };

        placeHouses(1, () => 0);
        placeHouses(-1, (name) => ({
            house1Scene: house1RightRotation,
            house2Scene: house2RightRotation,
            house3Scene: house3RightRotation,
            house4Scene: house4RightRotation,
            house5Scene: house5RightRotation,
        } as any)[name]);
    }

    // ── utils ─────────────────────────────────────────────────────────────────

    comupteBox(scene: THREE.Group) {
        const boundingBox = new THREE.Box3().setFromObject(scene);
        const size = new THREE.Vector3();
        boundingBox.getSize(size);
        return {
            x: size.x,
            y: size.y,
            z: size.z,
            center: new THREE.Vector3(size.x / 2, 0, size.z / 2),
        };
    }

    setThingName(group: THREE.Group, name = '') {
        group.traverse((child: any) => {
            if (child.isMesh) child.name = name;
        });
    }

    cloneModel(
        obj: any,
        x: number,
        y: number,
        z: number,
        rotation: number,
        scene: THREE.Group,
        collision?: false
    ) {
        const cloneObj = obj.clone();
        cloneObj.children.map((v: any, i: number) => {
            if (v.material) {
                v.material = obj.children[i].material.clone();
            }
        });
        if (rotation) cloneObj.rotateY(rotation);
        cloneObj.position.set(x, y, z);
        scene.add(cloneObj);
        return cloneObj;
    }
}
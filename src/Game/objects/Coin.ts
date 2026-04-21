import * as THREE from 'three';

export class Coin {
    public mesh: THREE.Mesh;
    public position: THREE.Vector3;       // authoritative world position
    private rotationSpeed: number;
    private collected: boolean = false;
    private birthTime: number;

    // Collision radius — increase if coins feel hard to grab
    private static readonly COLLISION_RADIUS = 1.2;

    constructor(x: number, y: number, z: number) {
        this.position = new THREE.Vector3(x, y, z);
        this.rotationSpeed = 0.05;
        this.birthTime = Date.now();

        const geometry = new THREE.TorusGeometry(0.5, 0.1, 16, 32);
        const material = new THREE.MeshStandardMaterial({
            color: 0xffaa00,
            metalness: 0.8,
            roughness: 0.2,
            emissive: 0x442200,
            emissiveIntensity: 0.5,
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = false;
    }

    public update(speed: number): void {
        if (this.collected) return;

        // Move coin toward player
        this.position.z += speed;

        // FIX: only the MESH gets the bobbing offset — this.position stays clean
        // so collision checks always use the true XZ position, not the visual bounce
        const bob = Math.sin((Date.now() - this.birthTime) * 0.005) * 0.15;
        this.mesh.position.set(this.position.x, this.position.y + bob, this.position.z);

        // Spin
        this.mesh.rotation.y += this.rotationSpeed;
        this.mesh.rotation.x += this.rotationSpeed / 2;
    }

    public checkCollision(playerPosition: THREE.Vector3): boolean {
        if (this.collected) return false;

        // FIX: compare XZ distance only — ignore Y so vertical bob never
        // causes a coin to be missed or double-detected
        const dx = this.position.x - playerPosition.x;
        const dz = this.position.z - playerPosition.z;
        const distXZ = Math.sqrt(dx * dx + dz * dz);

        if (distXZ < Coin.COLLISION_RADIUS) {
            this.collected = true;
            return true;
        }

        return false;
    }

    public dispose(): void {
        if (this.mesh.parent) {
            this.mesh.parent.remove(this.mesh);
        }
        this.mesh.geometry.dispose();
        (this.mesh.material as THREE.Material).dispose();
    }
}
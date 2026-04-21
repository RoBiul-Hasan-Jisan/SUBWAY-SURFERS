import * as THREE from 'three';

export class Coin {
    public mesh: THREE.Mesh;
    public position: THREE.Vector3;
    private rotationSpeed: number;
    private collected: boolean = false;
    
    constructor(x: number, y: number, z: number) {
        this.position = new THREE.Vector3(x, y, z);
        this.rotationSpeed = 0.05;
        
        const geometry = new THREE.TorusGeometry(0.5, 0.1, 16, 32);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0xffaa00,
            metalness: 0.8,
            roughness: 0.2,
            emissive: 0x442200,
            emissiveIntensity: 0.5
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = false;
    }
    
    public update(speed: number): void {
        if (!this.collected) {
            this.position.z += speed;
            this.mesh.position.z = this.position.z;
            this.mesh.rotation.y += this.rotationSpeed;
            this.mesh.rotation.x += this.rotationSpeed / 2;
            
            // Bobbing animation
            this.mesh.position.y = this.position.y + Math.sin(Date.now() * 0.005) * 0.1;
        }
    }
    
    public checkCollision(playerPosition: THREE.Vector3): boolean {
        if (this.collected) return false;
        
        const distance = this.position.distanceTo(playerPosition);
        const collisionDistance = 1.0;
        
        if (distance < collisionDistance) {
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
import * as THREE from 'three';

export class Obstacle {
    public mesh: THREE.Mesh;
    public position: THREE.Vector3;
    
    constructor(x: number, y: number, z: number) {
        this.position = new THREE.Vector3(x, y, z);
        
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0xff3333,
            metalness: 0.3,
            roughness: 0.7
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
    }
    
    public update(speed: number): void {
        this.position.z += speed;
        this.mesh.position.z = this.position.z;
        
        // Rotation animation
        this.mesh.rotation.y += 0.05;
        this.mesh.rotation.x += 0.03;
    }
    
    public checkCollision(playerPosition: THREE.Vector3): boolean {
        const distance = this.position.distanceTo(playerPosition);
        const collisionDistance = 0.8;
        
        return distance < collisionDistance;
    }
    
    public dispose(): void {
        if (this.mesh.parent) {
            this.mesh.parent.remove(this.mesh);
        }
        this.mesh.geometry.dispose();
        (this.mesh.material as THREE.Material).dispose();
    }
}
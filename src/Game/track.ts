import * as THREE from 'three';

export class Track {
    private segments: THREE.Mesh[] = [];
    private scene: THREE.Scene;
    private segmentLength: number = 10;
    private segmentCount: number = 10;
    
    constructor() {
        this.createTrack();
    }
    
    private createTrack(): void {
        const geometry = new THREE.PlaneGeometry(20, 10);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x44aa44,
            roughness: 0.8,
            metalness: 0.1
        });
        
        for (let i = 0; i < this.segmentCount; i++) {
            const segment = new THREE.Mesh(geometry, material);
            segment.rotation.x = -Math.PI / 2;
            segment.position.set(0, -0.5, -i * this.segmentLength);
            segment.receiveShadow = true;
            this.segments.push(segment);
        }
    }
    
    public addToScene(scene: THREE.Scene): void {
        this.segments.forEach(segment => scene.add(segment));
    }
    
    public update(speed: number): void {
        this.segments.forEach(segment => {
            segment.position.z += speed;
            if (segment.position.z > 10) {
                segment.position.z -= this.segmentCount * this.segmentLength;
            }
        });
    }
}
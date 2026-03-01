// Setup Three.js scene
const canvas = document.getElementById('particleCanvas');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2('#0a0a0a', 0.002);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 250;

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Particle system setup
const numParticles = 8000;
const geometry = new THREE.BufferGeometry();

// Generate positions for multiple shapes
const shapes = {
    sphere: new Float32Array(numParticles * 3),
    torus: new Float32Array(numParticles * 3),
    diamond: new Float32Array(numParticles * 3),
    galaxy: new Float32Array(numParticles * 3)
};

// Fill positions
for (let i = 0; i < numParticles; i++) {
    const i3 = i * 3;

    // 1. Crisp Sphere
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    const radius = 80 + (Math.random() * 2);
    shapes.sphere[i3] = radius * Math.sin(phi) * Math.cos(theta);
    shapes.sphere[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    shapes.sphere[i3 + 2] = radius * Math.cos(phi);

    // 2. Clear Double Helix (DNA/Legacy)
    const t = (i / numParticles) * Math.PI * 20; // 10 turns
    const helixRadius = 35;
    const helixHeight = 180;
    const yOffset = (i / numParticles) * helixHeight - (helixHeight / 2);
    if (i % 2 === 0) {
        shapes.torus[i3] = helixRadius * Math.cos(t);
        shapes.torus[i3 + 1] = yOffset;
        shapes.torus[i3 + 2] = helixRadius * Math.sin(t);
    } else {
        shapes.torus[i3] = helixRadius * Math.cos(t + Math.PI);
        shapes.torus[i3 + 1] = yOffset;
        shapes.torus[i3 + 2] = helixRadius * Math.sin(t + Math.PI);
    }
    // Very tiny scatter for definition
    shapes.torus[i3] += (Math.random() - 0.5) * 4;
    shapes.torus[i3 + 1] += (Math.random() - 0.5) * 4;
    shapes.torus[i3 + 2] += (Math.random() - 0.5) * 4;

    // 3. Sharp Geometric Diamond (8 sides)
    const h = (Math.random() - 0.5) * 180;
    const maxRadius = 60;
    const currentRadius = (1 - Math.abs(h) / 90) * maxRadius;
    const angle = Math.floor(Math.random() * 8) * (Math.PI / 4); // snapped to 8 angles
    const offsetRad = currentRadius + (Math.random() * 1.5);
    shapes.diamond[i3] = offsetRad * Math.cos(angle);
    shapes.diamond[i3 + 1] = h;
    shapes.diamond[i3 + 2] = offsetRad * Math.sin(angle);
    // Fill the faces slightly
    shapes.diamond[i3] += (Math.random() - 0.5) * 5;
    shapes.diamond[i3 + 2] += (Math.random() - 0.5) * 5;

    // 4. Pronounced Spiral Galaxy (5 distinct arms)
    const arm = i % 5;
    const angleOffset = (arm * Math.PI * 2) / 5;
    const rGalaxy = Math.random() * 160;
    // Tighter spiral
    const spiralAngle = rGalaxy * 0.06 + angleOffset;
    const scatterG = (Math.random() - 0.5) * (3 + rGalaxy * 0.08);
    const scatterYG = (Math.random() - 0.5) * (3 + rGalaxy * 0.04);

    shapes.galaxy[i3] = Math.cos(spiralAngle) * rGalaxy + scatterG;
    shapes.galaxy[i3 + 1] = scatterYG;
    shapes.galaxy[i3 + 2] = Math.sin(spiralAngle) * rGalaxy + scatterG;
}

// Set initial geometry attributes
geometry.setAttribute('position', new THREE.BufferAttribute(shapes.sphere.slice(), 3));
geometry.setAttribute('aStart', new THREE.BufferAttribute(shapes.sphere.slice(), 3));
geometry.setAttribute('aEnd', new THREE.BufferAttribute(shapes.torus.slice(), 3));

// Custom shader material for the pulsing dots
const material = new THREE.ShaderMaterial({
    uniforms: {
        uTime: { value: 0 },
        uProgress: { value: 0 },
        uColor1: { value: new THREE.Color('#ffffff') }, // White
        uColor2: { value: new THREE.Color('#950808') }  // Red
    },
    vertexShader: `
        uniform float uTime;
        uniform float uProgress;
        attribute vec3 aStart;
        attribute vec3 aEnd;
        
        varying vec3 vPos;
        varying float vMix;
        
        void main() {
            // Cubic easing for smoother morph
            float p = uProgress < 0.5 ? 4.0 * uProgress * uProgress * uProgress : 1.0 - pow(-2.0 * uProgress + 2.0, 3.0) / 2.0;

            vec3 pos = mix(aStart, aEnd, p);
            
            // Add very subtle pulse/wobble to keep shapes well-defined
            float wave = sin(uTime * 1.5 + pos.y * 0.05) * 1.0;
             pos.x += wave;
             pos.z -= wave * 0.3;
            
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            
            // Size based on depth and time pulse
            float pulseOffset = sin(uTime * 2.0 + aStart.x * 0.1) * 0.5 + 0.5;
            gl_PointSize = (100.0 / -mvPosition.z) * (0.5 + pulseOffset * 0.8);
            
            // Mix color based on noise/position
            vMix = sin(pos.x * 0.05 + pos.y * 0.05 + uTime) * 0.5 + 0.5;
            
            gl_Position = projectionMatrix * mvPosition;
            vPos = pos;
        }
    `,
    fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        varying vec3 vPos;
        varying float vMix;
        
        void main() {
            // Circular dot
            vec2 cxy = 2.0 * gl_PointCoord - 1.0;
            float r = dot(cxy, cxy);
            if (r > 1.0) discard;
            
            // Soft glow edge
            float alpha = 1.0 - r;
            
            vec3 finalColor = mix(uColor1, uColor2, vMix);
            
            gl_FragColor = vec4(finalColor, alpha * 0.7);
        }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
});

const points = new THREE.Points(geometry, material);
scene.add(points);

gsap.registerPlugin(ScrollTrigger);

// Track current shape stage
window.currentStage = 0;

let tl = gsap.timeline({
    scrollTrigger: {
        trigger: ".ph-main",
        start: "top top",
        end: "bottom bottom",
        scrub: 1.5
    }
});

// Animate progress from 0 to 3 (across 4 sections)
let morphProgress = { value: 0 };

tl.to(morphProgress, {
    value: 3,
    ease: "none",
    onUpdate: () => {
        let p = morphProgress.value;
        let stage = Math.floor(p);
        let stageProgress = p - stage;

        if (stage >= 3) {
            stage = 2;
            stageProgress = 1.0;
        }

        let startShape, endShape;
        if (stage === 0) {
            startShape = shapes.sphere; endShape = shapes.torus;
        } else if (stage === 1) {
            startShape = shapes.torus; endShape = shapes.diamond;
        } else {
            startShape = shapes.diamond; endShape = shapes.galaxy;
        }

        if (window.currentStage !== stage) {
            geometry.attributes.aStart.array.set(startShape);
            geometry.attributes.aStart.needsUpdate = true;
            geometry.attributes.aEnd.array.set(endShape);
            geometry.attributes.aEnd.needsUpdate = true;
            window.currentStage = stage;
        }

        material.uniforms.uProgress.value = stageProgress;
    }
});


// Intersection Observer for fade-in text
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        } else {
            // Optional: remove visible class when scrolling out if you want it to fade in again
            // entry.target.classList.remove('visible'); 
        }
    });
}, { threshold: 0.15 });

document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

// Animation Loop
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);

    // Rotate the whole system slowly
    points.rotation.y += 0.0015;
    points.rotation.x += 0.0005;

    material.uniforms.uTime.value = clock.getElapsedTime();

    renderer.render(scene, camera);
}
animate();

// Resize Handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Mouse parallax effect
let targetX = 0;
let targetY = 0;
document.addEventListener('mousemove', (e) => {
    targetX = (e.clientX / window.innerWidth) * 2 - 1;
    targetY = -(e.clientY / window.innerHeight) * 2 + 1;
});

// Smooth apply mouse parallax
gsap.ticker.add(() => {
    scene.rotation.x += (targetY * 0.1 - scene.rotation.x) * 0.05;
    scene.rotation.y += (targetX * 0.1 - scene.rotation.y) * 0.05;
});

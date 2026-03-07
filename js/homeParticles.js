/**
 * Baron Bacot — Homepage Particle Engine
 * A full‑viewport Three.js particle field that morphs
 * between four shapes as the user scrolls through sections.
 * Shapes: Void → Sphere → Double Helix → Galaxy
 */

(function () {
    const canvas = document.getElementById('homeCanvas');
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2('#0a0a0a', 0.0015);

    const camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.z = 260;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    /* ─── Particle Count ─── */
    const N = 9000;

    /* ─── Shape generators ─── */
    function mkSphere(n) {
        const a = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
            const i3 = i * 3;
            const th = Math.random() * Math.PI * 2;
            const ph = Math.acos(Math.random() * 2 - 1);
            const r = 90 + Math.random() * 4;
            a[i3] = r * Math.sin(ph) * Math.cos(th);
            a[i3 + 1] = r * Math.sin(ph) * Math.sin(th);
            a[i3 + 2] = r * Math.cos(ph);
        }
        return a;
    }

    function mkVoid(n) {
        /* Scattered nebula cloud — initial state */
        const a = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
            const i3 = i * 3;
            a[i3] = (Math.random() - 0.5) * 600;
            a[i3 + 1] = (Math.random() - 0.5) * 600;
            a[i3 + 2] = (Math.random() - 0.5) * 300;
        }
        return a;
    }

    function mkHelix(n) {
        const a = new Float32Array(n * 3);
        const helixR = 40, helixH = 200;
        for (let i = 0; i < n; i++) {
            const i3 = i * 3;
            const t = (i / n) * Math.PI * 22;
            const y = (i / n) * helixH - helixH / 2;
            const strand = i % 2 === 0 ? 0 : Math.PI;
            a[i3] = helixR * Math.cos(t + strand) + (Math.random() - 0.5) * 5;
            a[i3 + 1] = y + (Math.random() - 0.5) * 5;
            a[i3 + 2] = helixR * Math.sin(t + strand) + (Math.random() - 0.5) * 5;
        }
        return a;
    }

    function mkGalaxy(n) {
        const a = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
            const i3 = i * 3;
            const arm = i % 5;
            const armOffset = (arm * Math.PI * 2) / 5;
            const r = Math.random() * 180;
            const angle = r * 0.065 + armOffset;
            const scatter = (Math.random() - 0.5) * (4 + r * 0.09);
            const scatterY = (Math.random() - 0.5) * (3 + r * 0.045);
            a[i3] = Math.cos(angle) * r + scatter;
            a[i3 + 1] = scatterY;
            a[i3 + 2] = Math.sin(angle) * r + scatter;
        }
        return a;
    }

    function mkDiamond(n) {
        const a = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
            const i3 = i * 3;
            const h = (Math.random() - 0.5) * 190;
            const maxR = 65;
            const cr = (1 - Math.abs(h) / 95) * maxR;
            const ang = Math.floor(Math.random() * 8) * (Math.PI / 4);
            const ofr = cr + Math.random() * 2;
            a[i3] = ofr * Math.cos(ang) + (Math.random() - 0.5) * 6;
            a[i3 + 1] = h;
            a[i3 + 2] = ofr * Math.sin(ang) + (Math.random() - 0.5) * 6;
        }
        return a;
    }

    const shapes = {
        void: mkVoid(N),
        sphere: mkSphere(N),
        helix: mkHelix(N),
        diamond: mkDiamond(N),
        galaxy: mkGalaxy(N)
    };

    /* ─── Geometry & Shader ─── */
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(shapes.void.slice(), 3));
    geo.setAttribute('aStart', new THREE.BufferAttribute(shapes.void.slice(), 3));
    geo.setAttribute('aEnd', new THREE.BufferAttribute(shapes.sphere.slice(), 3));

    const mat = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uProgress: { value: 0 },
            uColor1: { value: new THREE.Color('#ffffff') },
            uColor2: { value: new THREE.Color('#950808') }
        },
        vertexShader: `
            uniform float uTime;
            uniform float uProgress;
            attribute vec3 aStart;
            attribute vec3 aEnd;
            varying float vMix;

            // Cubic EaseInOut
            float ease(float t) {
                return t < 0.5
                    ? 4.0 * t * t * t
                    : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
            }

            void main() {
                float p   = ease(uProgress);
                vec3  pos = mix(aStart, aEnd, p);

                // living micro-wobble
                float wave = sin(uTime * 1.2 + pos.y * 0.04) * 1.2;
                pos.x     += wave;
                pos.z     -= wave * 0.25;

                vec4 mv = modelViewMatrix * vec4(pos, 1.0);

                float pulse   = sin(uTime * 1.8 + aStart.x * 0.12) * 0.5 + 0.5;
                gl_PointSize  = (110.0 / -mv.z) * (0.45 + pulse * 0.9);

                vMix = sin(pos.x * 0.04 + pos.y * 0.04 + uTime * 0.7) * 0.5 + 0.5;

                gl_Position = projectionMatrix * mv;
            }
        `,
        fragmentShader: `
            uniform vec3  uColor1;
            uniform vec3  uColor2;
            varying float vMix;

            void main() {
                vec2  cxy = 2.0 * gl_PointCoord - 1.0;
                float r   = dot(cxy, cxy);
                if (r > 1.0) discard;

                float alpha      = 1.0 - r;
                vec3  finalColor = mix(uColor1, uColor2, vMix * 0.35);

                gl_FragColor = vec4(finalColor, alpha * 0.65);
            }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    const points = new THREE.Points(geo, mat);
    scene.add(points);

    /* ─── Scroll‑driven morphing ─── */
    // Map: stage 0 = void→sphere  1 = sphere→helix  2 = helix→galaxy  3 = galaxy→diamond
    const stageShapes = [
        [shapes.void, shapes.sphere],
        [shapes.sphere, shapes.helix],
        [shapes.helix, shapes.galaxy],
        [shapes.galaxy, shapes.diamond]
    ];

    let currentStage = -1;
    const morphProxy = { value: 0 };

    function updateMorph(raw) {
        const stage = Math.min(Math.floor(raw), stageShapes.length - 1);
        const stageProgress = raw - Math.floor(raw);

        if (stage !== currentStage) {
            geo.attributes.aStart.array.set(stageShapes[stage][0]);
            geo.attributes.aStart.needsUpdate = true;
            geo.attributes.aEnd.array.set(stageShapes[stage][1]);
            geo.attributes.aEnd.needsUpdate = true;
            currentStage = stage;
        }
        mat.uniforms.uProgress.value = stageProgress;
    }

    /* GSAP ScrollTrigger — tied to document body */
    gsap.registerPlugin(ScrollTrigger);
    gsap.to(morphProxy, {
        value: stageShapes.length,
        ease: 'none',
        scrollTrigger: {
            trigger: 'body',
            start: 'top top',
            end: 'bottom bottom',
            scrub: 2
        },
        onUpdate: () => updateMorph(morphProxy.value)
    });

    /* ─── Mouse parallax ─── */
    let tX = 0, tY = 0;
    document.addEventListener('mousemove', e => {
        tX = (e.clientX / window.innerWidth) * 2 - 1;
        tY = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    gsap.ticker.add(() => {
        scene.rotation.x += (tY * 0.08 - scene.rotation.x) * 0.04;
        scene.rotation.y += (tX * 0.08 - scene.rotation.y) * 0.04;
    });

    /* ─── Render loop ─── */
    const clock = new THREE.Clock();
    function animate() {
        requestAnimationFrame(animate);
        points.rotation.y += 0.0012;
        points.rotation.x += 0.0004;
        mat.uniforms.uTime.value = clock.getElapsedTime();
        renderer.render(scene, camera);
    }
    animate();

    /* ─── Resize ─── */
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
})();

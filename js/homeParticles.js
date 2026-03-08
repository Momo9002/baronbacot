/**
 * Baron Bacot — Homepage Particle Engine v2
 * Dramatic, cinematic, deeply visible particle field.
 * 14,000 brighter particles — no fog, closer camera, additive glow.
 */

(function () {
    const canvas = document.getElementById('homeCanvas');
    const scene = new THREE.Scene();
    // No fog — we want full visibility

    const camera = new THREE.PerspectiveCamera(
        65,
        window.innerWidth / window.innerHeight,
        0.1,
        2000
    );
    camera.position.z = 200; // closer = bigger particles

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    /* ─── Particle Count ─── */
    const N = 14000;

    /* ─── Shape generators ─── */
    function mkVoid(n) {
        // Initial state — deep space nebula, particles spread in a shell around camera
        const a = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
            const i3 = i * 3;
            // Spherical volume fill — not too far, not too close
            const r = 80 + Math.random() * 280;
            const th = Math.random() * Math.PI * 2;
            const ph = Math.acos(Math.random() * 2 - 1);
            a[i3] = r * Math.sin(ph) * Math.cos(th);
            a[i3 + 1] = r * Math.sin(ph) * Math.sin(th);
            a[i3 + 2] = r * Math.cos(ph);
        }
        return a;
    }

    function mkSphere(n) {
        const a = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
            const i3 = i * 3;
            const th = Math.random() * Math.PI * 2;
            const ph = Math.acos(Math.random() * 2 - 1);
            const r = 100 + Math.random() * 6;
            a[i3] = r * Math.sin(ph) * Math.cos(th);
            a[i3 + 1] = r * Math.sin(ph) * Math.sin(th);
            a[i3 + 2] = r * Math.cos(ph);
        }
        return a;
    }

    function mkHelix(n) {
        const a = new Float32Array(n * 3);
        const helixR = 45, helixH = 220;
        for (let i = 0; i < n; i++) {
            const i3 = i * 3;
            const t = (i / n) * Math.PI * 24;
            const y = (i / n) * helixH - helixH / 2;
            const strand = i % 2 === 0 ? 0 : Math.PI;
            a[i3] = helixR * Math.cos(t + strand) + (Math.random() - 0.5) * 4;
            a[i3 + 1] = y + (Math.random() - 0.5) * 3;
            a[i3 + 2] = helixR * Math.sin(t + strand) + (Math.random() - 0.5) * 4;
        }
        return a;
    }

    function mkGalaxy(n) {
        const a = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
            const i3 = i * 3;
            const arm = i % 5;
            const armOffset = (arm * Math.PI * 2) / 5;
            const r = 10 + Math.random() * 190;
            const angle = r * 0.06 + armOffset;
            const scatter = (Math.random() - 0.5) * (3 + r * 0.07);
            const scatterY = (Math.random() - 0.5) * (2 + r * 0.03);
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
            const h = (Math.random() - 0.5) * 200;
            const maxR = 70;
            const cr = (1 - Math.abs(h) / 100) * maxR;
            const ang = Math.floor(Math.random() * 8) * (Math.PI / 4);
            const ofr = cr + Math.random() * 2;
            a[i3] = ofr * Math.cos(ang) + (Math.random() - 0.5) * 5;
            a[i3 + 1] = h;
            a[i3 + 2] = ofr * Math.sin(ang) + (Math.random() - 0.5) * 5;
        }
        return a;
    }

    const shapes = {
        void: mkVoid(N),
        sphere: mkSphere(N),
        helix: mkHelix(N),
        galaxy: mkGalaxy(N),
        diamond: mkDiamond(N)
    };

    /* ─── Geometry ─── */
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(shapes.void.slice(), 3));
    geo.setAttribute('aStart', new THREE.BufferAttribute(shapes.void.slice(), 3));
    geo.setAttribute('aEnd', new THREE.BufferAttribute(shapes.sphere.slice(), 3));

    /* ─── Shader — dramatically brighter ─── */
    const mat = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uProgress: { value: 0 },
            uColor1: { value: new THREE.Color('#ffffff') },
            uColor2: { value: new THREE.Color('#ff2020') }, // brighter red
            uColor3: { value: new THREE.Color('#ffe8d0') }  // warm glow
        },
        vertexShader: `
            uniform float uTime;
            uniform float uProgress;
            attribute vec3 aStart;
            attribute vec3 aEnd;
            varying float vMix;
            varying float vDepth;
            varying float vPulse;

            float ease(float t) {
                return t < 0.5
                    ? 4.0 * t * t * t
                    : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
            }

            void main() {
                float p   = ease(uProgress);
                vec3  pos = mix(aStart, aEnd, p);

                // Living drift — organic, slow
                float drift = uTime * 0.5;
                pos.x += sin(drift + aStart.y * 0.03) * 2.5;
                pos.y += cos(drift + aStart.x * 0.03) * 1.5;
                pos.z += sin(drift * 0.7 + aStart.z * 0.02) * 2.0;

                vec4 mv = modelViewMatrix * vec4(pos, 1.0);

                // Per-particle pulse — each one breathes independently
                float pulse  = sin(uTime * 2.2 + aStart.x * 0.15 + aStart.y * 0.08) * 0.5 + 0.5;
                vPulse = pulse;

                // Size: much bigger base, depth-aware
                float depth  = 300.0 / -mv.z;
                gl_PointSize = depth * (2.5 + pulse * 3.5);  // ← KEY: was 0.45+pulse*0.9

                // Color mix — red tinge varies by position + time
                vMix   = sin(pos.x * 0.03 + pos.y * 0.03 + uTime * 0.4) * 0.5 + 0.5;
                vDepth = clamp(depth * 0.4, 0.0, 1.0);

                gl_Position = projectionMatrix * mv;
            }
        `,
        fragmentShader: `
            uniform vec3  uColor1;
            uniform vec3  uColor2;
            uniform vec3  uColor3;
            varying float vMix;
            varying float vDepth;
            varying float vPulse;

            void main() {
                vec2  cxy = 2.0 * gl_PointCoord - 1.0;
                float r   = dot(cxy, cxy);
                if (r > 1.0) discard;

                // Dual-layer glow: bright hard core + wide soft halo
                float core = 1.0 - smoothstep(0.0, 0.25, r);      // bright inner
                float halo = 1.0 - smoothstep(0.0, 1.0, r);       // wide soft glow
                float alpha = core * 0.95 + halo * 0.55;           // ← KEY: was 0.65 total

                // Colour: mostly white, occasionally red-tipped
                vec3 col = mix(uColor1, uColor2, vMix * vMix * 0.6);
                // Warm core for very bright particles
                col      = mix(col, uColor3, core * 0.3 * vPulse);

                gl_FragColor = vec4(col, alpha);
            }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    const points = new THREE.Points(geo, mat);
    scene.add(points);

    /* ─── Scroll-driven morphing ─── */
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

    gsap.registerPlugin(ScrollTrigger);
    gsap.to(morphProxy, {
        value: stageShapes.length,
        ease: 'none',
        scrollTrigger: {
            trigger: 'body',
            start: 'top top',
            end: 'bottom bottom',
            scrub: 2.5
        },
        onUpdate: () => updateMorph(morphProxy.value)
    });

    /* ─── Cinematic intro: particles slowly coalesce on load ─── */
    // Start from progress 0, animate aEnd from void→sphere slowly
    gsap.to(mat.uniforms.uProgress, {
        value: 0.6,
        duration: 4.0,
        ease: 'power2.inOut',
        delay: 0.3
    });

    /* ─── Mouse parallax ─── */
    let tX = 0, tY = 0;
    document.addEventListener('mousemove', e => {
        tX = (e.clientX / window.innerWidth) * 2 - 1;
        tY = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    gsap.ticker.add(() => {
        scene.rotation.x += (tY * 0.12 - scene.rotation.x) * 0.035;
        scene.rotation.y += (tX * 0.12 - scene.rotation.y) * 0.035;
    });

    /* ─── Gentle auto-rotation ─── */
    const clock = new THREE.Clock();
    function animate() {
        requestAnimationFrame(animate);
        const t = clock.getElapsedTime();
        points.rotation.y += 0.0018;
        points.rotation.x = Math.sin(t * 0.07) * 0.05;
        mat.uniforms.uTime.value = t;
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

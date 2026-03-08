/**
 * Baron Bacot — Homepage Particle Engine v3
 * ─────────────────────────────────────────
 * Cinematic deep-space background with scroll-driven morphing.
 * Palette shifts across sections: void (cold white) → sphere (gold)
 * → helix (crimson) → galaxy (warm ivory) → marble (stone gold)
 * → diamond (pure white fire)
 *
 * 16,000 particles · additive blending · per-particle pulse & drift
 * Section-aware hue rotation driven by ScrollTrigger progress
 */

(function () {
    const canvas = document.getElementById('homeCanvas');
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.z = 260; // pulled back = shapes appear smaller/calmer

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    /* ─── Particle count ─── */
    const N = 16000;

    /* ═══════════════════════════ SHAPE GENERATORS ═══════════════════════════ */

    /* 0 — Deep void: sparse nebula cloud */
    function mkVoid(n) {
        const a = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
            const i3 = i * 3;
            const r = 60 + Math.random() * 200; // smaller spread
            const th = Math.random() * Math.PI * 2;
            const ph = Math.acos(Math.random() * 2 - 1);
            a[i3] = r * Math.sin(ph) * Math.cos(th);
            a[i3 + 1] = r * Math.sin(ph) * Math.sin(th);
            a[i3 + 2] = r * Math.cos(ph);
        }
        return a;
    }

    /* 1 — Sphere: orb of light */
    function mkSphere(n) {
        const a = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
            const i3 = i * 3;
            const th = Math.random() * Math.PI * 2;
            const ph = Math.acos(Math.random() * 2 - 1);
            const r = 68 + Math.random() * 6; // smaller sphere
            a[i3] = r * Math.sin(ph) * Math.cos(th);
            a[i3 + 1] = r * Math.sin(ph) * Math.sin(th);
            a[i3 + 2] = r * Math.cos(ph);
        }
        return a;
    }

    /* 2 — Double helix: DNA strand, architectural */
    function mkHelix(n) {
        const a = new Float32Array(n * 3);
        const helixR = 32, helixH = 165; // tighter, shorter
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

    /* 3 — 5-arm galaxy spiral */
    function mkGalaxy(n) {
        const a = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
            const i3 = i * 3;
            const arm = i % 5;
            const armOff = (arm * Math.PI * 2) / 5;
            const r = 8 + Math.random() * 130; // tighter galaxy
            const angle = r * 0.06 + armOff;
            const scatter = (Math.random() - 0.5) * (2 + r * 0.06);
            const scatterY = (Math.random() - 0.5) * (1.5 + r * 0.02);
            a[i3] = Math.cos(angle) * r + scatter;
            a[i3 + 1] = scatterY;
            a[i3 + 2] = Math.sin(angle) * r + scatter;
        }
        return a;
    }

    /* 4 — Marble swirl: flowing stone veins */
    function mkMarble(n) {
        const a = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
            const i3 = i * 3;
            const t = (i / n) * Math.PI * 36;
            const r = 14 + Math.random() * 110; // smaller marble
            const warp = Math.sin(t * 0.3) * 24;
            const y = Math.sin(t * 0.08 + r * 0.04) * 55 + (Math.random() - 0.5) * 14;
            a[i3] = Math.cos(t * 0.15 + warp * 0.02) * r + (Math.random() - 0.5) * 6;
            a[i3 + 1] = y;
            a[i3 + 2] = Math.sin(t * 0.15 + warp * 0.02) * r + (Math.random() - 0.5) * 6;
        }
        return a;
    }

    /* 5 — Diamond octahedron: faceted precision */
    function mkDiamond(n) {
        const a = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
            const i3 = i * 3;
            const h = (Math.random() - 0.5) * 140; // shorter diamond
            const maxR = 50;
            const cr = (1 - Math.abs(h) / 70) * maxR;
            const ang = Math.floor(Math.random() * 8) * (Math.PI / 4);
            const ofr = cr + Math.random() * 2;
            a[i3] = ofr * Math.cos(ang) + (Math.random() - 0.5) * 4;
            a[i3 + 1] = h;
            a[i3 + 2] = ofr * Math.sin(ang) + (Math.random() - 0.5) * 4;
        }
        return a;
    }

    const shapes = {
        void: mkVoid(N),
        sphere: mkSphere(N),
        helix: mkHelix(N),
        galaxy: mkGalaxy(N),
        marble: mkMarble(N),
        diamond: mkDiamond(N)
    };

    /* ═══════════════════════════ GEOMETRY & MATERIAL ═══════════════════════════ */
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(shapes.void.slice(), 3));
    geo.setAttribute('aStart', new THREE.BufferAttribute(shapes.void.slice(), 3));
    geo.setAttribute('aEnd', new THREE.BufferAttribute(shapes.sphere.slice(), 3));

    const mat = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uProgress: { value: 0 },
            /* Cold base */
            uColor1: { value: new THREE.Color('#e8e8ff') },   // icy white
            /* Red accent */
            uColor2: { value: new THREE.Color('#cc1111') },   // baron red
            /* Warm glow */
            uColor3: { value: new THREE.Color('#ffd090') },   // warm amber
            /* Section tint — shifts section by section */
            uTint: { value: new THREE.Color('#ffffff') },
            uTintAmt: { value: 0.0 }
        },
        vertexShader: /* glsl */`
            uniform float uTime;
            uniform float uProgress;
            attribute vec3 aStart;
            attribute vec3 aEnd;
            varying float vMix;
            varying float vDepth;
            varying float vPulse;
            varying float vRed;

            float ease(float t) {
                return t < 0.5
                    ? 4.0 * t * t * t
                    : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
            }

            void main() {
                float p   = ease(uProgress);
                vec3  pos = mix(aStart, aEnd, p);

                /* Organic, breathing drift — very slow and calm */
                float drift = uTime * 0.18;
                pos.x += sin(drift       + aStart.y * 0.018) * 0.6; // Halved drift amplitude
                pos.y += cos(drift * 0.7 + aStart.x * 0.020) * 0.4; // Halved drift amplitude
                pos.z += sin(drift * 0.5 + aStart.z * 0.016) * 0.5; // Halved drift amplitude

                vec4 mv = modelViewMatrix * vec4(pos, 1.0);

                /* Per-particle independent pulse — slow breath */
                float pulse = sin(uTime * 0.45 + aStart.x * 0.10 + aStart.y * 0.07 + aStart.z * 0.05) * 0.5 + 0.5; // Slower pulse
                vPulse = pulse;

                /* Depth-based size */
                float depth = 280.0 / -mv.z;
                gl_PointSize = depth * (2.2 + pulse * 4.0);

                /* Colour axes */
                vMix   = sin(pos.x * 0.032 + pos.y * 0.028 + uTime * 0.35) * 0.5 + 0.5;
                vRed   = smoothstep(0.55, 1.0, vMix);
                vDepth = clamp(depth * 0.38, 0.0, 1.0);

                gl_Position = projectionMatrix * mv;
            }
        `,
        fragmentShader: /* glsl */`
            uniform vec3  uColor1;
            uniform vec3  uColor2;
            uniform vec3  uColor3;
            uniform vec3  uTint;
            uniform float uTintAmt;
            varying float vMix;
            varying float vDepth;
            varying float vPulse;
            varying float vRed;

            void main() {
                vec2  cxy = 2.0 * gl_PointCoord - 1.0;
                float r   = dot(cxy, cxy);
                if (r > 1.0) discard;

                /* Triple-layer glow: hard core + mid halo + wide nebula */
                float core  = 1.0 - smoothstep(0.0, 0.18, r);
                float mid   = 1.0 - smoothstep(0.0, 0.55, r);
                float nebula = 1.0 - smoothstep(0.0, 1.0,  r);
                float alpha = core * 1.0 + mid * 0.45 + nebula * 0.25;

                /* Colour: mostly cold white, red-tipped, warm core */
                vec3 col = mix(uColor1, uColor2, vRed * 0.65);
                col      = mix(col, uColor3, core * 0.35 * vPulse);

                /* Section tint blended in softly */
                col = mix(col, uTint, uTintAmt * 0.22);

                gl_FragColor = vec4(col, alpha);
            }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    const points = new THREE.Points(geo, mat);
    scene.add(points);

    /* ═══════════════════════════ SECTION TINTS ═══════════════════════════
       Each stage in the scroll gets a colour personality.
       Stage index matches the stageShapes array below.                    */
    const stageTints = [
        { color: '#e0e8ff', amt: 0.0 },  // void  → sphere   : cold white (neutral)
        { color: '#ffc866', amt: 0.4 },  // sphere→ helix    : warm gold
        { color: '#cc2200', amt: 0.35 },  // helix → galaxy   : baron red
        { color: '#f5e8c8', amt: 0.3 },  // galaxy→ marble   : ivory stone
        { color: '#d4b483', amt: 0.45 },  // marble→ diamond  : stone gold
    ];

    /* ═══════════════════════════ SCROLL MORPHING ═══════════════════════════ */
    const stageShapes = [
        [shapes.void, shapes.sphere],
        [shapes.sphere, shapes.helix],
        [shapes.helix, shapes.galaxy],
        [shapes.galaxy, shapes.marble],
        [shapes.marble, shapes.diamond]
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

            /* Smoothly crossfade section tint */
            const t = stageTints[Math.min(stage, stageTints.length - 1)];
            gsap.to(mat.uniforms.uTint.value, {
                r: new THREE.Color(t.color).r,
                g: new THREE.Color(t.color).g,
                b: new THREE.Color(t.color).b,
                duration: 1.8,
                ease: 'power2.inOut'
            });
            gsap.to(mat.uniforms.uTintAmt, {
                value: t.amt,
                duration: 1.8,
                ease: 'power2.inOut'
            });
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
            scrub: 4.0          // very lazy — shapes morph slowly
        },
        onUpdate: () => updateMorph(morphProxy.value)
    });

    /* ─── Cinematic entrance: void slowly coalesces into sphere ─── */
    gsap.to(mat.uniforms.uProgress, {
        value: 0.55,
        duration: 4.5,
        ease: 'power2.inOut',
        delay: 0.5
    });

    /* ─── Parallax: mouse moves the whole nebula slightly ─── */
    let tX = 0, tY = 0;
    document.addEventListener('mousemove', e => {
        tX = (e.clientX / window.innerWidth) * 2 - 1;
        tY = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    gsap.ticker.add(() => {
        scene.rotation.x += (tY * 0.10 - scene.rotation.x) * 0.03;
        scene.rotation.y += (tX * 0.10 - scene.rotation.y) * 0.03;
    });

    /* ─── Very slow auto-rotation ─── */
    const clock = new THREE.Clock();
    function animate() {
        requestAnimationFrame(animate);
        const t = clock.getElapsedTime();
        points.rotation.y += 0.00045;               // 3× slower
        points.rotation.x = Math.sin(t * 0.025) * 0.025; // barely noticeable tilt
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

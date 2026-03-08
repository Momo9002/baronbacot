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
    camera.position.z = 190;

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
            const r = 90 + Math.random() * 300;
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
            const r = 98 + Math.random() * 8;
            a[i3] = r * Math.sin(ph) * Math.cos(th);
            a[i3 + 1] = r * Math.sin(ph) * Math.sin(th);
            a[i3 + 2] = r * Math.cos(ph);
        }
        return a;
    }

    /* 2 — Double helix: DNA strand, architectural */
    function mkHelix(n) {
        const a = new Float32Array(n * 3);
        const helixR = 48, helixH = 240;
        for (let i = 0; i < n; i++) {
            const i3 = i * 3;
            const t = (i / n) * Math.PI * 26;
            const y = (i / n) * helixH - helixH / 2;
            const strand = i % 2 === 0 ? 0 : Math.PI;
            a[i3] = helixR * Math.cos(t + strand) + (Math.random() - 0.5) * 5;
            a[i3 + 1] = y + (Math.random() - 0.5) * 4;
            a[i3 + 2] = helixR * Math.sin(t + strand) + (Math.random() - 0.5) * 5;
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
            const r = 12 + Math.random() * 195;
            const angle = r * 0.06 + armOff;
            const scatter = (Math.random() - 0.5) * (3 + r * 0.07);
            const scatterY = (Math.random() - 0.5) * (2 + r * 0.025);
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
            const t = (i / n) * Math.PI * 40;
            const r = 20 + Math.random() * 160;
            const warp = Math.sin(t * 0.3) * 35;
            const y = Math.sin(t * 0.08 + r * 0.04) * 80 + (Math.random() - 0.5) * 20;
            a[i3] = Math.cos(t * 0.15 + warp * 0.02) * r + (Math.random() - 0.5) * 8;
            a[i3 + 1] = y;
            a[i3 + 2] = Math.sin(t * 0.15 + warp * 0.02) * r + (Math.random() - 0.5) * 8;
        }
        return a;
    }

    /* 5 — Diamond octahedron: faceted precision */
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

                /* Organic, breathing drift — different axes breathe at different rates */
                float drift = uTime * 0.42;
                pos.x += sin(drift       + aStart.y * 0.028) * 3.0;
                pos.y += cos(drift * 0.8 + aStart.x * 0.031) * 2.0;
                pos.z += sin(drift * 0.6 + aStart.z * 0.022) * 2.5;

                vec4 mv = modelViewMatrix * vec4(pos, 1.0);

                /* Per-particle independent pulse */
                float pulse = sin(uTime * 2.0 + aStart.x * 0.14 + aStart.y * 0.09 + aStart.z * 0.06) * 0.5 + 0.5;
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
            scrub: 2.0          // smooth lag behind scroll
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

    /* ─── Gentle auto-rotation + time uniform ─── */
    const clock = new THREE.Clock();
    function animate() {
        requestAnimationFrame(animate);
        const t = clock.getElapsedTime();
        points.rotation.y += 0.0015;
        points.rotation.x = Math.sin(t * 0.06) * 0.04;
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

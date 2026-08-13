// ── Mobile Video Autoplay Fix ────────────────────────────────────────────────────
(function initMobileVideos() {
    const videos = document.querySelectorAll('video');

    const prepareVideo = (video) => {
        if (!video) return;

        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');
        video.muted = true;
        video.loop = true;
        video.preload = 'auto';

        const playPromise = video.play();
        if (playPromise) {
            playPromise.catch(() => {
                const resumeOnInteraction = () => {
                    video.play().catch(() => {});
                };

                ['pointerdown', 'touchstart', 'click'].forEach((eventName) => {
                    document.addEventListener(eventName, resumeOnInteraction, { once: true, passive: true });
                });
            });
        }
    };

    videos.forEach((video) => prepareVideo(video));

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            videos.forEach((video) => video.pause());
            return;
        }

        videos.forEach((video) => {
            if (video.readyState >= 2) {
                video.play().catch(() => {});
            }
        });
    });
})();

// ── Seamless marquee init ────────────────────────────────────────────────────
(function initMarquee() {
    const track = document.querySelector('.marquee-track');
    if (!track) return;

    const seed = track.querySelector('.marquee-seed');
    if (!seed) return;

    // Clone until the track is well over 2× the screen width
    const minWidth = window.innerWidth * 2.5;
    while (track.scrollWidth < minWidth) {
        track.appendChild(seed.cloneNode(true));
    }

    // Clone the whole filled track once more (second half for seamless wrap)
    const half = track.innerHTML;
    track.innerHTML = half + half;

    // Animate: shift left by exactly 50% of total width = one full copy
    track.style.animation = 'marqueeScroll 25s linear infinite';
})();

// Custom cursor with trailing effect
const cursorDot = document.createElement('div');
cursorDot.className = 'cursor-dot';
document.body.appendChild(cursorDot);

let mouseX = 0;
let mouseY = 0;
let lastTrailX = 0;
let lastTrailY = 0;
let trailHue = 0; // cycles 0–360 for rainbow colour
const TRAIL_SPACING = 2; // px — very tight so dots look like a solid line

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // Update main cursor dot
    cursorDot.style.left = mouseX + 'px';
    cursorDot.style.top = mouseY + 'px';

    // Only spawn trail dot once enough distance has been covered
    const dx = mouseX - lastTrailX;
    const dy = mouseY - lastTrailY;
    if (Math.sqrt(dx * dx + dy * dy) >= TRAIL_SPACING) {
        trailHue = (trailHue + 1.2) % 360;
        createTrail(mouseX, mouseY, trailHue);
        lastTrailX = mouseX;
        lastTrailY = mouseY;
    }
});

function createTrail(x, y, hue) {
    const trail = document.createElement('div');
    trail.className = 'cursor-trail';
    trail.style.left = x + 'px';
    trail.style.top = y + 'px';
    trail.style.background = `hsl(${hue}, 100%, 65%)`;
    trail.style.boxShadow = `0 0 6px hsl(${hue}, 100%, 65%)`;
    document.body.appendChild(trail);

    // Animate and remove trail — slow fade for a long lingering tail
    let opacity = 0.9;
    const fadeInterval = setInterval(() => {
        opacity -= 0.010;
        trail.style.opacity = opacity;

        if (opacity <= 0) {
            clearInterval(fadeInterval);
            trail.remove();
        }
    }, 16);
}

// Hide cursor when leaving window
document.addEventListener('mouseout', () => {
    cursorDot.style.opacity = '0';
});

document.addEventListener('mouseover', () => {
    cursorDot.style.opacity = '1';
});

// Simple script for smooth scrolling
// Smooth-scroll for anchors, but skip anchors with .no-smooth so they jump instantly
document.querySelectorAll('a[href^="#"]:not(.no-smooth)').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// ── Copy Email button ─────────────────────────────────────────────────────────
const copyBtn = document.getElementById('copy-email-btn');
if (copyBtn) {
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText('cruz9gabriel@gmail.com').then(() => {
            copyBtn.textContent = 'Copied!';
            copyBtn.classList.add('btn-flash');
            setTimeout(() => {
                copyBtn.textContent = 'Copy Email';
                copyBtn.classList.remove('btn-flash');
            }, 1800);
        });
    });
}


document.addEventListener('DOMContentLoaded', () => {
    const heroEls = [
        document.querySelector('.hero-title'),
        document.querySelector('.hero-subtitle'),
        document.querySelector('.hero-description'),
        document.querySelector('.cta-button'),
    ];
    heroEls.forEach((el, i) => {
        if (!el) return;
        el.classList.add('hero-anim-hidden');
        setTimeout(() => {
            el.classList.add('hero-anim-in');
        }, 300 + i * 220);
    });
});

// ─── 3D Scene — 80 floating instances ────────────────────────────────────────
const canvas = document.getElementById('canvas-3d');
if (canvas) {
    const COUNT = 46;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.physicallyCorrectLights = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 2.8;  // brighter overall
    camera.position.z = 6;

    // Start invisible — will fade in once models are ready
    canvas.style.transition = 'opacity 2.2s ease';
    canvas.style.opacity = '0';

    // ── Lighting (soft, wide spread) ─────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xd0dff0, 3.5));
    [
        { c: 0xffffff, i: 12, p: [12, 12, 12] },   // main key
        { c: 0xc0d8ff, i: 8, p: [-14, -8, -12] }, // cool fill
        { c: 0xffffff, i: 7, p: [0, 14, -8] },  // top back
        { c: 0xe8f0ff, i: 5, p: [-12, 12, 12] },  // rim
        { c: 0xfff0e0, i: 4, p: [12, -14, 8] },  // warm bottom
        { c: 0xffffff, i: 6, p: [0, 0, 18] },  // front fill
        { c: 0xd0e8ff, i: 4, p: [-8, 0, 16] },  // soft side
        // ── Backlights — behind the models, creating rim/halo glow ──────
        { c: 0x88bbff, i: 18, p: [0, 0, -10] },   // centre back cool blue
        { c: 0xaaddff, i: 14, p: [10, 6, -8] },   // back-right cool
        { c: 0x99ccff, i: 14, p: [-10, -6, -8] }, // back-left cool
        { c: 0xffeedd, i: 10, p: [0, -12, -9] },  // back-bottom warm
    ].forEach(({ c, i, p }) => {
        const l = new THREE.PointLight(c, i, 200);  // distance 200 — very wide falloff
        l.position.set(...p);
        scene.add(l);
    });

    // ── Compute world bounds at z=0 ───────────────────────────────────────────
    function worldBounds() {
        const fovRad = (60 * Math.PI) / 180;
        const halfH = Math.tan(fovRad / 2) * camera.position.z;
        const halfW = halfH * (window.innerWidth / window.innerHeight);
        return { halfW, halfH };
    }

    // ── Screen → world ────────────────────────────────────────────────────────
    function screenToWorld(ex, ey) {
        const { halfW, halfH } = worldBounds();
        return {
            x: (ex / window.innerWidth * 2 - 1) * halfW,
            y: -(ey / window.innerHeight * 2 - 1) * halfH
        };
    }

    const instances = [];
    const RADIUS = 1.2;
    const DAMPING = 0.97;
    const REPULSE_STRENGTH = 0.025;  // strong enough to actually separate models
    const BOUNDS_MARGIN = 1.4;       // large enough to keep model geometry on-screen
    const MAX_SPEED = 0.012;         // cap so motion stays slow and dreamy
    let sharedMaterial = null;       // shared ref so animate() can cycle its colour

    // ── Glossy metal material ─────────────────────────────────────────────────
    renderer.outputEncoding = THREE.sRGBEncoding;

    // ── Load GLB, then clone ──────────────────────────────────────────────────
    if (typeof THREE.GLTFLoader !== 'undefined') {
        const loader = new THREE.GLTFLoader();
        loader.load(
            GG2_GLB_DATA,
            (gltf) => {
                const template = gltf.scene;
                const box = new THREE.Box3().setFromObject(template);
                const size = box.getSize(new THREE.Vector3());
                const templateScale = 1.2 / Math.max(size.x, size.y, size.z);

                // Apply glossy metal material to every mesh in the template
                sharedMaterial = new THREE.MeshStandardMaterial({
                    color: 0xc8d0d8,
                    metalness: 1.0,
                    roughness: 0.04,
                    envMapIntensity: 3.0,
                });
                template.traverse(child => {
                    if (child.isMesh) child.material = sharedMaterial;
                });

                const { halfW, halfH } = worldBounds();

                for (let i = 0; i < COUNT; i++) {
                    const mesh = template.clone(true);
                    mesh.scale.setScalar(templateScale);

                    // Fly-in spawn — start far outside frame, drift inward
                    const flyAngle = Math.random() * Math.PI * 2;
                    const flyDist = 2.0 + Math.random() * 0.8; // 2–2.8× outside bounds
                    const px = Math.cos(flyAngle) * halfW * flyDist;
                    const py = Math.sin(flyAngle) * halfH * flyDist;
                    // Initial velocity aimed roughly toward center with slight spread
                    const speed = 0.03 + Math.random() * 0.02;
                    const aimX = (Math.random() - 0.5) * halfW * 0.6 - px;
                    const aimY = (Math.random() - 0.5) * halfH * 0.6 - py;
                    const aimLen = Math.sqrt(aimX * aimX + aimY * aimY) || 1;
                    const initVx = (aimX / aimLen) * speed;
                    const initVy = (aimY / aimLen) * speed;
                    mesh.position.set(px, py, 0);
                    scene.add(mesh);

                    const rs = {
                        x: (Math.random() - 0.5) * 0.003,
                        y: (Math.random() - 0.5) * 0.004,
                        z: (Math.random() - 0.5) * 0.002,
                    };
                    instances.push({
                        mesh, px, py,
                        vx: initVx,
                        vy: initVy,
                        phase: Math.random() * Math.PI * 2,
                        baseScale: templateScale,
                        clickAnim: 0,
                        rotSpeed: { ...rs },
                        baseRotSpeed: { ...rs },
                    });
                }
                console.log(`✅ ${COUNT} GLB instances ready`);
                // Fade the canvas in smoothly now that models are positioned
                setTimeout(() => { canvas.style.opacity = '1'; }, 80);
            },
            undefined,
            (err) => {
                console.error('GLB load error:', err);
                // Fallback: small torus knots
                const geo = new THREE.TorusKnotGeometry(0.55, 0.22, 80, 12);
                const { halfW, halfH } = worldBounds();
                for (let i = 0; i < COUNT; i++) {
                    const mat = new THREE.MeshStandardMaterial({ color: 0xd0d8e8, metalness: 1, roughness: 0.15 });
                    const mesh = new THREE.Mesh(geo, mat);
                    const px = (Math.random() * 2 - 1) * halfW * 0.88;
                    const py = (Math.random() * 2 - 1) * halfH * 0.88;
                    mesh.position.set(px, py, 0);
                    scene.add(mesh);
                    const rs = { x: (Math.random() - 0.5) * 0.003, y: (Math.random() - 0.5) * 0.004, z: (Math.random() - 0.5) * 0.002 };
                    instances.push({
                        mesh, px, py,
                        vx: (Math.random() - 0.5) * 0.003,
                        vy: (Math.random() - 0.5) * 0.003,
                        phase: Math.random() * Math.PI * 2,
                        baseScale: 1, clickAnim: 0,
                        rotSpeed: { ...rs },
                        baseRotSpeed: { ...rs },
                    });
                }
            }
        );
    }

    // ── Raycaster + drag ──────────────────────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const mouse2D = new THREE.Vector2();
    let dragIndex = -1;   // which instance is being dragged
    let dragWorldX = 0, dragWorldY = 0;

    canvas.style.cursor = 'grab';

    function getNDC(ex, ey) {
        return new THREE.Vector2(
            (ex / window.innerWidth) * 2 - 1,
            -(ey / window.innerHeight) * 2 + 1
        );
    }

    canvas.addEventListener('mousedown', (e) => {
        raycaster.setFromCamera(getNDC(e.clientX, e.clientY), camera);

        // Collect all meshes (including children for GLB groups)
        const allMeshes = [];
        instances.forEach((inst, idx) => {
            inst.mesh.traverse(child => {
                if (child.isMesh || child.isGroup) {
                    child._instanceIdx = idx;
                    allMeshes.push(child);
                }
            });
        });

        const hits = raycaster.intersectObjects(allMeshes, true);
        if (hits.length > 0) {
            // Walk up to find the instance index
            let obj = hits[0].object;
            while (obj && obj._instanceIdx === undefined) obj = obj.parent;
            if (obj !== null && obj._instanceIdx !== undefined) {
                dragIndex = obj._instanceIdx;
            } else {
                // fallback: just use first hit's instance
                dragIndex = allMeshes[0]._instanceIdx ?? 0;
            }
            canvas.style.cursor = 'grabbing';
            const w = screenToWorld(e.clientX, e.clientY);
            dragWorldX = w.x;
            dragWorldY = w.y;
        }
    });

    // Track mouse world position always (for hover reaction + drag)
    let mouseWX = 0, mouseWY = 0;

    // ── Mouse 3D light — warm spotlight that follows cursor ───────────────────
    const mouseLight = new THREE.PointLight(0xffe8c0, 55, 12); // warm, very bright
    mouseLight.position.set(0, 0, 2);
    scene.add(mouseLight);
    const mouseFill = new THREE.PointLight(0xffffff, 20, 28);  // wide soft halo
    mouseFill.position.set(0, 0, 3);
    scene.add(mouseFill);

    window.addEventListener('mousemove', (e) => {
        const w = screenToWorld(e.clientX, e.clientY);
        mouseWX = w.x;
        mouseWY = w.y;
        // Slide the light to cursor position slightly in front of canvas plane
        mouseLight.position.set(w.x, w.y, 2);
        mouseFill.position.set(w.x, w.y, 3);
        if (dragIndex !== -1) {
            dragWorldX = w.x;
            dragWorldY = w.y;
        }
    });

    window.addEventListener('mouseup', () => {
        if (dragIndex !== -1) {
            // Give it the current velocity from drag delta
            dragIndex = -1;
            canvas.style.cursor = 'grab';
        }
    });

    // ── Animation ─────────────────────────────────────────────────────────────
    let t = 0;
    function animate() {
        requestAnimationFrame(animate);
        t += 0.007;

        if (instances.length === 0) { renderer.render(scene, camera); return; }

        // Cycle the shared metal colour slowly through the HSL hue wheel
        if (sharedMaterial) {
            sharedMaterial.color.setHSL((t * 0.018) % 1, 0.55, 0.72);
        }

        const { halfW, halfH } = worldBounds();
        const bW = halfW - BOUNDS_MARGIN;
        const bH = halfH - BOUNDS_MARGIN;

        // 1a. Repulsion — push overlapping models apart
        for (let a = 0; a < instances.length; a++) {
            for (let b = a + 1; b < instances.length; b++) {
                const ia = instances[a], ib = instances[b];
                const dx = ia.px - ib.px;
                const dy = ia.py - ib.py;
                const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
                const minD = RADIUS * 2;
                if (dist < minD) {
                    const nx = dx / dist, ny = dy / dist;
                    const force = REPULSE_STRENGTH * (minD - dist) / minD;
                    // Velocity nudge
                    if (a !== dragIndex) { ia.vx += nx * force; ia.vy += ny * force; }
                    if (b !== dragIndex) { ib.vx -= nx * force; ib.vy -= ny * force; }
                    // Hard position correction — push centers apart so they never overlap
                    const overlap = (minD - dist) * 0.5;
                    if (a !== dragIndex) { ia.px += nx * overlap * 0.5; ia.py += ny * overlap * 0.5; }
                    if (b !== dragIndex) { ib.px -= nx * overlap * 0.5; ib.py -= ny * overlap * 0.5; }
                }
            }
        }

        // 2. Update each instance
        instances.forEach((inst, idx) => {
            if (idx === dragIndex) {
                // Smooth drag follow
                inst.px += (dragWorldX - inst.px) * 0.16;
                inst.py += (dragWorldY - inst.py) * 0.16;
                inst.vx = 0; inst.vy = 0;
            } else {
                // Float — ultra-slow gentle bob only
                const wave = Math.sin(t * 0.15 + inst.phase) * 0.00015;
                inst.vx += wave;
                inst.vy += Math.cos(t * 0.12 + inst.phase) * 0.00015;

                // Damping — very high, almost no carry-over
                inst.vx *= 0.98;
                inst.vy *= 0.98;

                // Clamp speed so motion stays slow and smooth
                const spd = Math.sqrt(inst.vx * inst.vx + inst.vy * inst.vy);
                if (spd > MAX_SPEED) { inst.vx = (inst.vx / spd) * MAX_SPEED; inst.vy = (inst.vy / spd) * MAX_SPEED; }

                inst.px += inst.vx;
                inst.py += inst.vy;

                // Soft boundary — gentle inward force near edges (never teleports)
                const edgeZone = 1.8;
                const edgeForce = 0.004;
                if (inst.px > bW - edgeZone) inst.vx -= edgeForce * ((inst.px - (bW - edgeZone)) / edgeZone);
                if (inst.px < -bW + edgeZone) inst.vx += edgeForce * ((-bW + edgeZone - inst.px) / edgeZone);
                if (inst.py > bH - edgeZone) inst.vy -= edgeForce * ((inst.py - (bH - edgeZone)) / edgeZone);
                if (inst.py < -bH + edgeZone) inst.vy += edgeForce * ((-bH + edgeZone - inst.py) / edgeZone);
            }

            inst.mesh.position.set(inst.px, inst.py, 0);

            // ── Hover reaction: tilt + gentle pull toward cursor when nearby ──
            const hdx = mouseWX - inst.px;
            const hdy = mouseWY - inst.py;
            const hDist = Math.sqrt(hdx * hdx + hdy * hdy);
            const HOVER_RADIUS = 2.0;   // reduced radius — less far-reaching
            if (hDist < HOVER_RADIUS && idx !== dragIndex) {
                const influence = 1 - hDist / HOVER_RADIUS;
                const targetTiltX = -(hdy / HOVER_RADIUS) * 0.35 * influence;
                const targetTiltY = (hdx / HOVER_RADIUS) * 0.35 * influence;
                inst.mesh.rotation.x += (targetTiltX - inst.mesh.rotation.x) * 0.03;
                inst.mesh.rotation.y += (targetTiltY - inst.mesh.rotation.y) * 0.03;
                // Very weak flee
                inst.vx -= (hdx / hDist) * 0.0005 * influence;
                inst.vy -= (hdy / hDist) * 0.0005 * influence;
            } else {
                // Normal tumble when not hovered
                inst.mesh.rotation.x += inst.rotSpeed.x;
                inst.mesh.rotation.y += inst.rotSpeed.y;
                inst.mesh.rotation.z += inst.rotSpeed.z;
            }
        });

        renderer.render(scene, camera);
    }
    animate();

    // ── Resize ────────────────────────────────────────────────────────────────
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

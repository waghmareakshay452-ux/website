// ============================================================================
// Web Craft — Hero 3D Scene (Three.js / WebGL)
// ============================================================================
// This file is completely independent of the rest of the website's code.
// It only ever touches:
//   #heroStage   (the hero-stage container)
//   #heroCanvas  (the <canvas> inside it)
//   .stage-fallback (the CSS placeholder panel already inside #heroStage)
//
// It is loaded lazily via a small inline bootstrap in index.html (dynamic
// import after window "load"), so it never blocks the initial page render.
//
// REAL 3D MODEL: this currently renders a procedural placeholder laptop +
// phone built from real Three.js geometry (genuine WebGL — not a flat image,
// not CSS 3D). To upgrade to an actual laptop/phone model:
//   1. Export a combined glTF Binary (.glb) scene containing both devices,
//      already scaled/positioned sensibly relative to each other.
//   2. Place the file at:  /assets/models/webcraft-devices.glb
//      (i.e. create an "assets/models" folder next to index.html on your
//      Netlify site and drop the .glb file in there).
//   3. Nothing else needs to change — GLTFLoader below already looks for
//      that exact path on every page load, and will swap it in automatically,
//      keeping the same lighting, particles, parallax and scroll behaviour.
//      Until that file exists, loading it fails silently and the procedural
//      placeholder below keeps rendering — the page never breaks either way.
// ============================================================================

import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';

const MODEL_URL = '/assets/models/webcraft-devices.glb';

function supportsWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
}

function boot() {
  const stage = document.getElementById('heroStage');
  const canvas = document.getElementById('heroCanvas');
  if (!stage || !canvas) return;

  if (!supportsWebGL()) {
    const fb = stage.querySelector('.stage-fallback span');
    if (fb) fb.textContent = '3D preview isn\u2019t supported in this browser.';
    return; // fallback panel stays visible permanently — no fake device, no error
  }

  initHeroScene(stage, canvas);
}

function initHeroScene(stage, canvas) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const isMobile = innerWidth < 760;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0.55, 7.6);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;

  // ---------------- lighting (soft studio setup + brand-colour rim lights) ----------------
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));

  const key = new THREE.DirectionalLight(0xffffff, 1.15);
  key.position.set(3, 5, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -4; key.shadow.camera.right = 4;
  key.shadow.camera.top = 4; key.shadow.camera.bottom = -4;
  scene.add(key);

  const rimBlue = new THREE.PointLight(0x51c8ff, 6, 12);
  rimBlue.position.set(-3.2, 1.6, -2);
  scene.add(rimBlue);

  const rimViolet = new THREE.PointLight(0x8b6cff, 5, 12);
  rimViolet.position.set(3.2, -1, -3);
  scene.add(rimViolet);

  // ---------------- soft contact shadow ----------------
  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 14),
    new THREE.ShadowMaterial({ opacity: 0.22 })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = -1.35;
  shadowPlane.receiveShadow = true;
  scene.add(shadowPlane);

  // ---------------- device group ----------------
  const deviceGroup = new THREE.Group();
  scene.add(deviceGroup);
  buildPlaceholderDevices(deviceGroup);

  // Attempt to upgrade to a real model, if one has been supplied (see header comment).
  new GLTFLoader().load(
    MODEL_URL,
    (gltf) => {
      deviceGroup.clear();
      gltf.scene.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      deviceGroup.add(gltf.scene);
      if (reduce) renderer.render(scene, camera); // reflect the upgrade even in the static reduced-motion frame
    },
    undefined,
    () => { /* no model at MODEL_URL yet — expected until one is supplied; placeholder stays */ }
  );

  // ---------------- particle field (GPU-friendly, shader-driven flow) ----------------
  const COUNT = isMobile ? 380 : 1400;
  const positions = new Float32Array(COUNT * 3);
  const seeds = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    const r = 2.4 + Math.random() * 3.2;
    const theta = Math.random() * Math.PI * 2;
    const y = (Math.random() - 0.5) * 3.6;
    positions[i * 3] = Math.cos(theta) * r;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = Math.sin(theta) * r * 0.6 - 1.5;
    seeds[i] = Math.random() * 100;
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

  const particleMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) }
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      uniform float uTime;
      uniform float uPixelRatio;
      attribute float aSeed;
      varying float vFade;
      vec3 flow(vec3 p, float t){
        vec3 q = p * 0.5 + vec3(0.0, 0.0, t * 0.12);
        float nx = sin(q.y * 1.3 + t * 0.6) + sin(q.z * 1.7 - t * 0.4);
        float ny = sin(q.z * 1.1 - t * 0.5) + sin(q.x * 1.5 + t * 0.35);
        float nz = sin(q.x * 1.2 + t * 0.45) + sin(q.y * 1.4 - t * 0.3);
        return vec3(nx, ny, nz);
      }
      void main(){
        vec3 p = position;
        p += flow(p, uTime + aSeed) * 0.28;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float dist = -mv.z;
        gl_PointSize = (2.2 + sin(uTime * 1.5 + aSeed) * 0.6) * uPixelRatio * (140.0 / dist);
        vFade = smoothstep(9.0, 3.0, dist);
      }
    `,
    fragmentShader: `
      varying float vFade;
      void main(){
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        float alpha = smoothstep(0.5, 0.0, d) * vFade * 0.85;
        vec3 col = mix(vec3(0.32,0.78,1.0), vec3(0.55,0.42,1.0), 0.5 + uv.x);
        gl_FragColor = vec4(col, alpha);
      }
    `
  });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  // ---------------- pointer parallax (desktop only, subtle) ----------------
  let targetX = 0, targetY = 0, curX = 0, curY = 0;
  if (fine && !reduce) {
    addEventListener('pointermove', (e) => {
      targetX = e.clientX / innerWidth - 0.5;
      targetY = e.clientY / innerHeight - 0.5;
    }, { passive: true });
  }

  // ---------------- scroll-driven offset (reads scroll only — doesn't alter the site's own scroll system) ----------------
  let scrollT = 0;
  function readScroll() {
    const r = stage.getBoundingClientRect();
    scrollT = Math.min(1, Math.max(-1, r.top / innerHeight));
  }
  addEventListener('scroll', readScroll, { passive: true });
  readScroll();

  // ---------------- responsive sizing ----------------
  function resize() {
    const w = stage.clientWidth || 1, h = stage.clientHeight || 1;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    if (reduce) renderer.render(scene, camera); // keep the static frame correct after a resize
  }
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage);
  else addEventListener('resize', resize);
  resize();

  // ---------------- pause the loop when off-screen or the tab is hidden ----------------
  let running = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => { running = entries[0].isIntersecting; }, { threshold: 0 }).observe(stage);
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) running = false; });

  // ---------------- render ----------------
  if (reduce) {
    // Respect prefers-reduced-motion fully: one static, correctly-lit frame, no animation loop at all.
    renderer.render(scene, camera);
  } else {
    const clock = new THREE.Clock();
    (function tick() {
      requestAnimationFrame(tick);
      if (!running) return;
      const t = clock.getElapsedTime();
      particleMat.uniforms.uTime.value = t;
      curX += (targetX - curX) * 0.05;
      curY += (targetY - curY) * 0.05;
      deviceGroup.rotation.y = Math.sin(t * 0.3) * 0.22 - curX * 0.4;
      deviceGroup.rotation.x = Math.cos(t * 0.24) * 0.05 + curY * 0.15;
      deviceGroup.position.y = Math.sin(t * 0.6) * 0.06 - scrollT * 0.5;
      particles.rotation.y = t * 0.03;
      renderer.render(scene, camera);
    })();
  }

  stage.classList.add('scene-active'); // first frame is already on the canvas — fade the fallback out
}

// ---------------- procedural placeholder devices (real WebGL geometry, not an image) ----------------
function buildPlaceholderDevices(group) {
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xcfd3db, metalness: 0.75, roughness: 0.32 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x14161c, metalness: 0.4, roughness: 0.5 });

  const base = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.14, 2.0), bodyMat);
  base.position.set(-0.4, -0.55, 0.1);
  base.castShadow = true; base.receiveShadow = true;
  group.add(base);

  const lidPivot = new THREE.Group();
  lidPivot.position.set(-0.4, -0.48, 0.1 - 1.0);
  lidPivot.rotation.x = -1.75; // ~100° open
  group.add(lidPivot);

  const lid = new THREE.Mesh(new THREE.BoxGeometry(3.1, 1.9, 0.08), darkMat);
  lid.position.set(0, 0.95, 0);
  lid.castShadow = true;
  lidPivot.add(lid);

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(2.86, 1.66),
    new THREE.MeshBasicMaterial({ map: makeScreenTexture() })
  );
  screen.position.set(0, 0.95, 0.045);
  lidPivot.add(screen);

  const phone = new THREE.Mesh(new THREE.BoxGeometry(0.78, 1.62, 0.07), darkMat);
  phone.position.set(1.85, -0.15, 0.9);
  phone.rotation.y = -0.35;
  phone.castShadow = true; phone.receiveShadow = true;
  group.add(phone);

  const phoneScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.68, 1.5),
    new THREE.MeshBasicMaterial({ map: makePhoneTexture() })
  );
  phoneScreen.position.set(1.85, -0.15, 0.935);
  phoneScreen.rotation.y = -0.35;
  group.add(phoneScreen);

  group.scale.setScalar(1.05);
}

function makeScreenTexture() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 640;
  const ctx = c.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 1024, 640);
  grad.addColorStop(0, '#eaf8ff'); grad.addColorStop(1, '#edf0ff');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 1024, 640);

  ctx.fillStyle = '#10131a';
  ctx.font = '700 44px Manrope, sans-serif';
  ctx.fillText('Web Craft.', 60, 100);
  ctx.font = '600 22px DM Sans, sans-serif';
  ctx.fillStyle = '#647085';
  ctx.fillText('Premium digital experiences', 60, 138);

  ctx.font = '800 80px Manrope, sans-serif';
  ctx.fillStyle = '#10131a';
  ctx.fillText('Built to', 60, 320);
  ctx.fillText('be trusted.', 60, 410);

  const orb = ctx.createRadialGradient(820, 220, 10, 820, 220, 180);
  orb.addColorStop(0, '#ffffff'); orb.addColorStop(1, 'rgba(139,108,255,0.25)');
  ctx.fillStyle = orb;
  ctx.beginPath(); ctx.arc(820, 220, 180, 0, Math.PI * 2); ctx.fill();

  const tex = new THREE.CanvasTexture(c);
  if ('colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makePhoneTexture() {
  const c = document.createElement('canvas');
  c.width = 420; c.height = 900;
  const ctx = c.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 900);
  grad.addColorStop(0, '#fbfcff'); grad.addColorStop(1, '#eef1f8');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 420, 900);

  const card = ctx.createLinearGradient(0, 0, 420, 300);
  card.addColorStop(0, 'rgba(81,200,255,0.65)'); card.addColorStop(1, 'rgba(139,108,255,0.6)');
  ctx.fillStyle = card; ctx.fillRect(40, 90, 340, 220);

  ctx.fillStyle = '#dde1ea';
  ctx.fillRect(40, 350, 300, 20);
  ctx.fillRect(40, 390, 180, 20);

  ctx.fillStyle = '#10131a';
  ctx.fillRect(40, 800, 340, 60);

  const tex = new THREE.CanvasTexture(c);
  if ('colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

boot();


import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

const stage = document.getElementById('heroStage');
const canvas = document.getElementById('heroCanvas');

if (!stage || !canvas) {
  throw new Error('Web Craft 3D hero elements not found.');
}

/* -------------------------------------------------------
   SCENE
------------------------------------------------------- */

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  32,
  1,
  0.1,
  100
);

camera.position.set(0, 1.25, 10);
camera.lookAt(0, 0.85, 0);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance'
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

/* -------------------------------------------------------
   LIGHTING
------------------------------------------------------- */

scene.add(
  new THREE.HemisphereLight(
    0xffffff,
    0xb9c4dc,
    2.0
  )
);

const keyLight = new THREE.DirectionalLight(
  0xffffff,
  3.2
);

keyLight.position.set(-4, 7, 7);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
scene.add(keyLight);

const blueLight = new THREE.PointLight(
  0x58bfff,
  12,
  12
);

blueLight.position.set(4, 2.5, 3);
scene.add(blueLight);

const violetLight = new THREE.PointLight(
  0x9c78ff,
  9,
  10
);

violetLight.position.set(-4, 1.5, 1);
scene.add(violetLight);

/* -------------------------------------------------------
   MATERIALS
------------------------------------------------------- */

const silver = new THREE.MeshStandardMaterial({
  color: 0xd9dee7,
  metalness: 0.82,
  roughness: 0.24
});

const silverDark = new THREE.MeshStandardMaterial({
  color: 0xaeb7c5,
  metalness: 0.85,
  roughness: 0.27
});

const black = new THREE.MeshStandardMaterial({
  color: 0x11141a,
  metalness: 0.45,
  roughness: 0.3
});

const keyboardMat = new THREE.MeshStandardMaterial({
  color: 0x252a32,
  metalness: 0.25,
  roughness: 0.58
});

const keyMat = new THREE.MeshStandardMaterial({
  color: 0x3b414b,
  metalness: 0.12,
  roughness: 0.5
});

const glass = new THREE.MeshPhysicalMaterial({
  color: 0x0c111b,
  metalness: 0.15,
  roughness: 0.18,
  transmission: 0.04,
  clearcoat: 0.8
});

const white = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  metalness: 0.05,
  roughness: 0.35
});

/* -------------------------------------------------------
   HELPERS
------------------------------------------------------- */

function roundedBox(
  width,
  height,
  depth,
  radius = 0.08,
  material
) {
  const shape = new THREE.Shape();

  const x = -width / 2;
  const y = -height / 2;

  shape.moveTo(x + radius, y);

  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(
    x + width,
    y,
    x + width,
    y + radius
  );

  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(
    x + width,
    y + height,
    x + width - radius,
    y + height
  );

  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(
    x,
    y + height,
    x,
    y + height - radius
  );

  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(
    x,
    y,
    x + radius,
    y
  );

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: radius * 0.45,
    bevelThickness: radius * 0.45,
    curveSegments: 6
  });

  geometry.translate(0, 0, -depth / 2);

  const mesh = new THREE.Mesh(
    geometry,
    material
  );

  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
}

function plane(
  width,
  height,
  material,
  x = 0,
  y = 0,
  z = 0
) {
  const geometry = new THREE.PlaneGeometry(
    width,
    height
  );

  const mesh = new THREE.Mesh(
    geometry,
    material
  );

  mesh.position.set(x, y, z);

  return mesh;
}

/* -------------------------------------------------------
   TEXTURE HELPERS
------------------------------------------------------- */

function createLaptopScreenTexture() {
  const c = document.createElement('canvas');

  c.width = 1200;
  c.height = 760;

  const ctx = c.getContext('2d');

  const gradient = ctx.createLinearGradient(
    0,
    0,
    1200,
    760
  );

  gradient.addColorStop(0, '#101827');
  gradient.addColorStop(0.45, '#172b4c');
  gradient.addColorStop(1, '#273b66');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 760);

  const glow = ctx.createRadialGradient(
    780,
    250,
    30,
    780,
    250,
    500
  );

  glow.addColorStop(
    0,
    'rgba(78,194,255,.55)'
  );

  glow.addColorStop(
    1,
    'rgba(78,194,255,0)'
  );

  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 1200, 760);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 72px Arial';
  ctx.fillText(
    'WEB CRAFT',
    90,
    155
  );

  ctx.fillStyle = '#a9bddb';
  ctx.font = '400 30px Arial';
  ctx.fillText(
    'Premium digital experiences',
    94,
    205
  );

  ctx.fillStyle = 'rgba(255,255,255,.09)';
  ctx.roundRect(
    90,
    285,
    470,
    230,
    28
  );
  ctx.fill();

  ctx.fillStyle = '#69d0ff';
  ctx.font = '700 34px Arial';
  ctx.fillText(
    'DESIGN',
    125,
    350
  );

  ctx.fillStyle = '#d8e5f7';
  ctx.font = '400 25px Arial';
  ctx.fillText(
    'Fast',
    125,
    405
  );

  ctx.fillText(
    'Elegant',
    125,
    445
  );

  ctx.fillText(
    'Built to convert',
    125,
    485
  );

  const texture = new THREE.CanvasTexture(c);

  texture.colorSpace = THREE.SRGBColorSpace;

  return texture;
}

function createPhoneTexture() {
  const c = document.createElement('canvas');

  c.width = 600;
  c.height = 1100;

  const ctx = c.getContext('2d');

  const gradient = ctx.createLinearGradient(
    0,
    0,
    600,
    1100
  );

  gradient.addColorStop(0, '#111a2d');
  gradient.addColorStop(0.5, '#152c52');
  gradient.addColorStop(1, '#0e1525');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 600, 1100);

  ctx.fillStyle = 'rgba(255,255,255,.08)';
  ctx.roundRect(
    45,
    150,
    510,
    300,
    32
  );
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 52px Arial';
  ctx.fillText(
    'WEB CRAFT',
    78,
    235
  );

  ctx.fillStyle = '#70d5ff';
  ctx.font = '700 28px Arial';
  ctx.fillText(
    'YOUR DIGITAL PRESENCE',
    78,
    300
  );

  ctx.fillStyle = '#b8c9e4';
  ctx.font = '400 25px Arial';
  ctx.fillText(
    'Designed for growth.',
    78,
    350
  );

  ctx.fillStyle = 'rgba(105,208,255,.18)';
  ctx.roundRect(
    45,
    520,
    510,
    180,
    28
  );
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '600 31px Arial';
  ctx.fillText(
    'Premium websites',
    78,
    585
  );

  ctx.fillStyle = '#9fb2ce';
  ctx.font = '400 24px Arial';
  ctx.fillText(
    'Fast • Modern • Strategic',
    78,
    630
  );

  const texture = new THREE.CanvasTexture(c);

  texture.colorSpace = THREE.SRGBColorSpace;

  return texture;
}

/* -------------------------------------------------------
   MAIN HERO GROUP
------------------------------------------------------- */

const hero = new THREE.Group();

hero.position.y = 0.05;

scene.add(hero);

/* =======================================================
   LAPTOP
======================================================= */

const laptop = new THREE.Group();

laptop.position.set(
  -0.55,
  0.15,
  0
);

laptop.rotation.y = -0.18;
laptop.rotation.x = -0.02;

hero.add(laptop);

/* -------------------------------------------------------
   LAPTOP BASE
------------------------------------------------------- */

const base = roundedBox(
  4.65,
  2.75,
  0.24,
  0.16,
  silver
);

base.position.set(
  0,
  0,
  0
);

base.rotation.x = -0.035;

laptop.add(base);

/* -------------------------------------------------------
   TOP KEYBOARD DECK
------------------------------------------------------- */

const deck = roundedBox(
  4.25,
  2.30,
  0.055,
  0.11,
  keyboardMat
);

deck.position.set(
  0,
  0.08,
  0.15
);

deck.rotation.x = -0.035;

laptop.add(deck);

/* -------------------------------------------------------
   KEYBOARD
------------------------------------------------------- */

const keyboard = new THREE.Group();

keyboard.position.set(
  -0.08,
  0.16,
  0.195
);

keyboard.rotation.x = -0.035;

laptop.add(keyboard);

const rows = [
  14,
  14,
  13,
  12,
  10
];

const keyW = 0.245;
const keyH = 0.18;
const gap = 0.045;

rows.forEach((count, row) => {

  const rowWidth =
    count * keyW +
    (count - 1) * gap;

  const startX =
    -rowWidth / 2;

  for (let i = 0; i < count; i++) {

    const key = roundedBox(
      keyW,
      keyH,
      0.045,
      0.025,
      keyMat
    );

    key.position.set(
      startX +
      i * (keyW + gap) +
      keyW / 2,
      0,
      row * (keyH + gap)
    );

    keyboard.add(key);
  }
});

/* -------------------------------------------------------
   SPACE BAR
------------------------------------------------------- */

const spaceBar = roundedBox(
  1.42,
  0.18,
  0.045,
  0.025,
  keyMat
);

spaceBar.position.set(
  0,
  0,
  1.12
);

keyboard.add(spaceBar);

/* -------------------------------------------------------
   TRACKPAD
------------------------------------------------------- */

const trackpad = roundedBox(
  1.52,
  0.93,
  0.035,
  0.08,
  new THREE.MeshStandardMaterial({
    color: 0x343a44,
    metalness: 0.15,
    roughness: 0.48
  })
);

trackpad.position.set(
  0,
  -0.58,
  0.205
);

trackpad.rotation.x = -0.035;

laptop.add(trackpad);

/* -------------------------------------------------------
   FRONT PALM REST
------------------------------------------------------- */

const palmRest = roundedBox(
  4.18,
  0.72,
  0.045,
  0.08,
  silverDark
);

palmRest.position.set(
  0,
  -0.87,
  0.17
);

palmRest.rotation.x = -0.035;

laptop.add(palmRest);

/* -------------------------------------------------------
   LAPTOP LID
------------------------------------------------------- */

const lid = new THREE.Group();

lid.position.set(
  0,
  1.37,
  -0.02
);

laptop.add(lid);

/* Outer lid */

const lidOuter = roundedBox(
  4.65,
  2.82,
  0.20,
  0.16,
  silver
);

lidOuter.position.set(
  0,
  1.30,
  -0.02
);

lidOuter.rotation.x = 0.10;

lid.add(lidOuter);

/* Inner black bezel */

const bezel = roundedBox(
  4.25,
  2.43,
  0.055,
  0.10,
  black
);

bezel.position.set(
  0,
  1.30,
  0.105
);

bezel.rotation.x = 0.10;

lid.add(bezel);

/* Screen */

const screenTexture =
  createLaptopScreenTexture();

const screenMaterial =
  new THREE.MeshBasicMaterial({
    map: screenTexture,
    side: THREE.FrontSide
  });

const screen = plane(
  4.02,
  2.20,
  screenMaterial
);

screen.position.set(
  0,
  1.30,
  0.145
);

screen.rotation.x = 0.10;

lid.add(screen);

/* -------------------------------------------------------
   WEBCAM
------------------------------------------------------- */

const webcam = new THREE.Mesh(
  new THREE.SphereGeometry(
    0.035,
    16,
    16
  ),
  black
);

webcam.position.set(
  0,
  2.34,
  0.18
);

lid.add(webcam);

/* -------------------------------------------------------
   LAPTOP LOGO
------------------------------------------------------- */

const logo = new THREE.Mesh(
  new THREE.CircleGeometry(
    0.17,
    32
  ),
  new THREE.MeshStandardMaterial({
    color: 0xf4f7fb,
    metalness: 0.8,
    roughness: 0.2,
    emissive: 0x111827,
    emissiveIntensity: 0.3
  })
);

logo.position.set(
  0,
  0.32,
  -0.125
);

logo.rotation.x = -Math.PI / 2;

laptop.add(logo);

/* -------------------------------------------------------
   HINGES
------------------------------------------------------- */

for (const x of [-1.45, 1.45]) {

  const hinge = new THREE.Mesh(
    new THREE.CylinderGeometry(
      0.10,
      0.10,
      0.48,
      24
    ),
    silverDark
  );

  hinge.rotation.z = Math.PI / 2;

  hinge.position.set(
    x,
    1.28,
    0.0
  );

  laptop.add(hinge);
}

/* =======================================================
   PHONE
======================================================= */

const phone = new THREE.Group();

phone.position.set(
  2.35,
  1.05,
  0.55
);

phone.rotation.set(
  0.02,
  -0.18,
  0.035
);

phone.scale.setScalar(0.86);

hero.add(phone);

/* -------------------------------------------------------
   PHONE BODY
------------------------------------------------------- */

const phoneBody = roundedBox(
  1.55,
  3.28,
  0.25,
  0.18,
  black
);

phone.add(phoneBody);

/* -------------------------------------------------------
   PHONE FRONT GLASS
------------------------------------------------------- */

const phoneTexture =
  createPhoneTexture();

const phoneScreenMaterial =
  new THREE.MeshBasicMaterial({
    map: phoneTexture
  });

const phoneScreen = roundedBox(
  1.38,
  3.08,
  0.035,
  0.15,
  phoneScreenMaterial
);

phoneScreen.position.z = 0.145;

phone.add(phoneScreen);

/* -------------------------------------------------------
   DYNAMIC ISLAND
------------------------------------------------------- */

const island = roundedBox(
  0.58,
  0.15,
  0.045,
  0.075,
  new THREE.MeshStandardMaterial({
    color: 0x050608,
    metalness: 0.1,
    roughness: 0.25
  })
);

island.position.set(
  0,
  1.31,
  0.17
);

phone.add(island);

/* -------------------------------------------------------
   PHONE SIDE BUTTONS
------------------------------------------------------- */

const sideButtonMat =
  new THREE.MeshStandardMaterial({
    color: 0x6f7885,
    metalness: 0.8,
    roughness: 0.25
  });

const volumeUp = roundedBox(
  0.09,
  0.38,
  0.08,
  0.035,
  sideButtonMat
);

volumeUp.position.set(
  -0.81,
  0.62,
  0
);

phone.add(volumeUp);

const volumeDown = roundedBox(
  0.09,
  0.38,
  0.08,
  0.035,
  sideButtonMat
);

volumeDown.position.set(
  -0.81,
  0.13,
  0
);

phone.add(volumeDown);

const power = roundedBox(
  0.09,
  0.58,
  0.08,
  0.035,
  sideButtonMat
);

power.position.set(
  0.81,
  0.45,
  0
);

phone.add(power);

/* -------------------------------------------------------
   PHONE CAMERA BUMP
------------------------------------------------------- */

const cameraBump = roundedBox(
  0.64,
  0.76,
  0.14,
  0.14,
  new THREE.MeshStandardMaterial({
    color: 0x1b2029,
    metalness: 0.55,
    roughness: 0.28
  })
);

cameraBump.position.set(
  -0.37,
  1.02,
  -0.20
);

phone.add(cameraBump);

for (
  let i = 0;
  i < 3;
  i++
) {

  const lens = new THREE.Mesh(
    new THREE.CylinderGeometry(
      0.105,
      0.105,
      0.035,
      24
    ),
    new THREE.MeshStandardMaterial({
      color: 0x05070a,
      metalness: 0.9,
      roughness: 0.12
    })
  );

  lens.rotation.x =
    Math.PI / 2;

  const positions = [
    [-0.50, 1.22],
    [-0.24, 1.22],
    [-0.50, 0.94]
  ];

  lens.position.set(
    positions[i][0],
    positions[i][1],
    -0.29
  );

  phone.add(lens);
}

/* =======================================================
   GROUND SHADOW
======================================================= */

const shadowMaterial =
  new THREE.MeshBasicMaterial({
    color: 0x59667a,
    transparent: true,
    opacity: 0.13,
    depthWrite: false
  });

const shadow = new THREE.Mesh(
  new THREE.PlaneGeometry(
    8.5,
    3.8
  ),
  shadowMaterial
);

shadow.rotation.x =
  -Math.PI / 2;

shadow.position.set(
  0,
  -1.25,
  0
);

hero.add(shadow);

/* =======================================================
   FLOATING PARTICLES
======================================================= */

const particleGeometry =
  new THREE.BufferGeometry();

const particleCount = 70;

const particlePositions =
  new Float32Array(
    particleCount * 3
  );

for (
  let i = 0;
  i < particleCount;
  i++
) {

  particlePositions[i * 3] =
    (Math.random() - 0.5) * 9;

  particlePositions[i * 3 + 1] =
    (Math.random() - 0.5) * 5;

  particlePositions[i * 3 + 2] =
    (Math.random() - 0.5) * 4;
}

particleGeometry.setAttribute(
  'position',
  new THREE.BufferAttribute(
    particlePositions,
    3
  )
);

const particleMaterial =
  new THREE.PointsMaterial({
    color: 0x9edfff,
    size: 0.018,
    transparent: true,
    opacity: 0.42,
    depthWrite: false
  });

const particles =
  new THREE.Points(
    particleGeometry,
    particleMaterial
  );

scene.add(particles);

/* =======================================================
   POINTER PARALLAX
======================================================= */

let pointerX = 0;
let pointerY = 0;

window.addEventListener(
  'pointermove',
  event => {

    pointerX =
      (event.clientX /
        window.innerWidth -
        0.5) *
      2;

    pointerY =
      (event.clientY /
        window.innerHeight -
        0.5) *
      2;
  },
  { passive: true }
);

/* =======================================================
   RESIZE
======================================================= */

function resize() {

  const width =
    stage.clientWidth || 600;

  const height =
    stage.clientHeight || 400;

  camera.aspect =
    width / height;

  camera.updateProjectionMatrix();

  renderer.setSize(
    width,
    height,
    false
  );
}

window.addEventListener(
  'resize',
  resize
);

resize();

/* =======================================================
   ANIMATION
======================================================= */

const clock =
  new THREE.Clock();

let visible = true;

const observer =
  new IntersectionObserver(
    entries => {

      visible =
        entries[0]?.isIntersecting !== false;
    },
    {
      threshold: 0.05
    }
  );

observer.observe(stage);

function animate() {

  requestAnimationFrame(
    animate
  );

  if (!visible) return;

  const t =
    clock.getElapsedTime();

  hero.position.y =
    0.05 +
    Math.sin(t * 0.8) *
    0.055;

  hero.rotation.y =
    THREE.MathUtils.lerp(
      hero.rotation.y,
      pointerX * 0.045,
      0.035
    );

  hero.rotation.x =
    THREE.MathUtils.lerp(
      hero.rotation.x,
      pointerY * -0.018,
      0.035
    );

  particles.rotation.y =
    t * 0.018;

  renderer.render(
    scene,
    camera
  );
}

stage.classList.add(
  'scene-active'
);

animate();

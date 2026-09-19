import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { RoundedBoxGeometry } from 'https://unpkg.com/three@0.160.0/examples/jsm/geometries/RoundedBoxGeometry.js';

const stage = document.getElementById('heroStage');
const canvas = document.getElementById('heroCanvas');

if (!stage || !canvas) {
  throw new Error('Web Craft hero stage not found.');
}

/* =========================================================
   SCENE
========================================================= */

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  30,
  1,
  0.1,
  100
);

camera.position.set(0, 2.15, 10.5);
camera.lookAt(0, 0.75, 0);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance'
});

renderer.setPixelRatio(
  Math.min(window.devicePixelRatio || 1, 2)
);

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

/* =========================================================
   LIGHTING
========================================================= */

scene.add(
  new THREE.HemisphereLight(
    0xffffff,
    0x9ba8bd,
    2.2
  )
);

const keyLight = new THREE.DirectionalLight(
  0xffffff,
  3.5
);

keyLight.position.set(-4, 7, 8);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);

scene.add(keyLight);

const blueLight = new THREE.PointLight(
  0x55c8ff,
  10,
  12
);

blueLight.position.set(4, 2.5, 4);
scene.add(blueLight);

const violetLight = new THREE.PointLight(
  0x8d70ff,
  7,
  10
);

violetLight.position.set(-4, 2, 1);
scene.add(violetLight);

/* =========================================================
   MATERIALS
========================================================= */

const aluminum = new THREE.MeshStandardMaterial({
  color: 0xcfd5df,
  metalness: 0.88,
  roughness: 0.24
});

const aluminumDark = new THREE.MeshStandardMaterial({
  color: 0x9da7b5,
  metalness: 0.9,
  roughness: 0.25
});

const darkMetal = new THREE.MeshStandardMaterial({
  color: 0x1a1e26,
  metalness: 0.42,
  roughness: 0.38
});

const keyboardMaterial = new THREE.MeshStandardMaterial({
  color: 0x242932,
  metalness: 0.2,
  roughness: 0.58
});

const keyMaterial = new THREE.MeshStandardMaterial({
  color: 0x444a54,
  metalness: 0.12,
  roughness: 0.52
});

const blackMaterial = new THREE.MeshStandardMaterial({
  color: 0x080a0e,
  metalness: 0.35,
  roughness: 0.25
});

const silverButton = new THREE.MeshStandardMaterial({
  color: 0x737d8c,
  metalness: 0.8,
  roughness: 0.22
});

/* =========================================================
   HELPERS
========================================================= */

function roundedBox(
  width,
  height,
  depth,
  radius,
  material,
  segments = 5
) {
  const geometry = new RoundedBoxGeometry(
    width,
    height,
    depth,
    segments,
    radius
  );

  const mesh = new THREE.Mesh(
    geometry,
    material
  );

  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
}

function makePlane(
  width,
  height,
  material
) {
  return new THREE.Mesh(
    new THREE.PlaneGeometry(
      width,
      height
    ),
    material
  );
}

/* =========================================================
   SCREEN TEXTURE
========================================================= */

function createScreenTexture() {

  const canvas = document.createElement('canvas');

  canvas.width = 1200;
  canvas.height = 760;

  const ctx = canvas.getContext('2d');

  const gradient =
    ctx.createLinearGradient(
      0,
      0,
      1200,
      760
    );

  gradient.addColorStop(
    0,
    '#091321'
  );

  gradient.addColorStop(
    0.48,
    '#13294a'
  );

  gradient.addColorStop(
    1,
    '#263d68'
  );

  ctx.fillStyle = gradient;
  ctx.fillRect(
    0,
    0,
    1200,
    760
  );

  const glow =
    ctx.createRadialGradient(
      850,
      230,
      20,
      850,
      230,
      500
    );

  glow.addColorStop(
    0,
    'rgba(77,202,255,.65)'
  );

  glow.addColorStop(
    1,
    'rgba(77,202,255,0)'
  );

  ctx.fillStyle = glow;
  ctx.fillRect(
    0,
    0,
    1200,
    760
  );

  ctx.fillStyle = '#ffffff';

  ctx.font =
    '700 72px Arial';

  ctx.fillText(
    'WEB CRAFT',
    90,
    155
  );

  ctx.fillStyle =
    '#a9bdd8';

  ctx.font =
    '400 30px Arial';

  ctx.fillText(
    'Premium digital experiences',
    94,
    205
  );

  ctx.fillStyle =
    'rgba(255,255,255,.08)';

  ctx.beginPath();

  ctx.roundRect(
    90,
    285,
    470,
    225,
    28
  );

  ctx.fill();

  ctx.fillStyle =
    '#6bd2ff';

  ctx.font =
    '700 34px Arial';

  ctx.fillText(
    'DESIGN',
    125,
    350
  );

  ctx.fillStyle =
    '#d9e5f5';

  ctx.font =
    '400 25px Arial';

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

  const texture =
    new THREE.CanvasTexture(
      canvas
    );

  texture.colorSpace =
    THREE.SRGBColorSpace;

  return texture;
}

/* =========================================================
   PHONE TEXTURE
========================================================= */

function createPhoneTexture() {

  const canvas =
    document.createElement('canvas');

  canvas.width = 600;
  canvas.height = 1100;

  const ctx =
    canvas.getContext('2d');

  const gradient =
    ctx.createLinearGradient(
      0,
      0,
      600,
      1100
    );

  gradient.addColorStop(
    0,
    '#0c1729'
  );

  gradient.addColorStop(
    0.5,
    '#12305a'
  );

  gradient.addColorStop(
    1,
    '#0b1322'
  );

  ctx.fillStyle =
    gradient;

  ctx.fillRect(
    0,
    0,
    600,
    1100
  );

  ctx.fillStyle =
    'rgba(255,255,255,.08)';

  ctx.beginPath();

  ctx.roundRect(
    45,
    150,
    510,
    300,
    32
  );

  ctx.fill();

  ctx.fillStyle =
    '#ffffff';

  ctx.font =
    '700 52px Arial';

  ctx.fillText(
    'WEB CRAFT',
    78,
    235
  );

  ctx.fillStyle =
    '#70d5ff';

  ctx.font =
    '700 27px Arial';

  ctx.fillText(
    'DIGITAL EXPERIENCE',
    78,
    300
  );

  ctx.fillStyle =
    '#b9cbe4';

  ctx.font =
    '400 24px Arial';

  ctx.fillText(
    'Designed for growth.',
    78,
    350
  );

  ctx.fillStyle =
    'rgba(105,208,255,.15)';

  ctx.beginPath();

  ctx.roundRect(
    45,
    520,
    510,
    180,
    28
  );

  ctx.fill();

  ctx.fillStyle =
    '#ffffff';

  ctx.font =
    '600 31px Arial';

  ctx.fillText(
    'Premium websites',
    78,
    585
  );

  ctx.fillStyle =
    '#9fb3cf';

  ctx.font =
    '400 24px Arial';

  ctx.fillText(
    'Fast • Modern • Strategic',
    78,
    630
  );

  const texture =
    new THREE.CanvasTexture(
      canvas
    );

  texture.colorSpace =
    THREE.SRGBColorSpace;

  return texture;
}

/* =========================================================
   HERO GROUP
========================================================= */

const hero =
  new THREE.Group();

hero.position.set(
  0,
  0.05,
  0
);

scene.add(hero);

/* =========================================================
   REALISTIC LAPTOP
========================================================= */

const laptop =
  new THREE.Group();

laptop.position.set(
  -0.45,
  0.0,
  0
);

laptop.rotation.y =
  -0.20;

hero.add(laptop);

/* ---------------------------------------------------------
   BASE
--------------------------------------------------------- */

const base =
  roundedBox(
    4.75,
    0.30,
    3.05,
    0.16,
    aluminum,
    6
  );

base.position.set(
  0,
  0,
  0
);

laptop.add(base);

/* ---------------------------------------------------------
   KEYBOARD DECK
--------------------------------------------------------- */

const deck =
  roundedBox(
    4.35,
    0.07,
    2.55,
    0.08,
    keyboardMaterial,
    5
  );

deck.position.set(
  0,
  0.18,
  0.05
);

laptop.add(deck);

/* ---------------------------------------------------------
   KEYBOARD
--------------------------------------------------------- */

const keyboard =
  new THREE.Group();

keyboard.position.set(
  -0.10,
  0.23,
  -0.22
);

laptop.add(keyboard);

const keyRows = [
  14,
  14,
  13,
  12
];

const keyWidth = 0.245;
const keyDepth = 0.22;
const keyGap = 0.045;

keyRows.forEach(
  (count, row) => {

    const total =
      count * keyWidth +
      (count - 1) * keyGap;

    const start =
      -total / 2;

    for (
      let i = 0;
      i < count;
      i++
    ) {

      const key =
        roundedBox(
          keyWidth,
          0.055,
          keyDepth,
          0.025,
          keyMaterial,
          4
        );

      key.position.set(
        start +
        i *
          (keyWidth + keyGap) +
        keyWidth / 2,

        0,

        row *
          (keyDepth + keyGap)
      );

      keyboard.add(key);
    }
  }
);

/* ---------------------------------------------------------
   SPACE BAR
--------------------------------------------------------- */

const spaceBar =
  roundedBox(
    1.35,
    0.055,
    0.22,
    0.025,
    keyMaterial,
    4
  );

spaceBar.position.set(
  0,
  0,
  1.06
);

keyboard.add(spaceBar);

/* ---------------------------------------------------------
   TRACKPAD
--------------------------------------------------------- */

const trackpad =
  roundedBox(
    1.45,
    0.045,
    0.92,
    0.08,
    aluminumDark,
    5
  );

trackpad.position.set(
  0,
  0.235,
  1.0
);

laptop.add(trackpad);

/* ---------------------------------------------------------
   PALM REST
--------------------------------------------------------- */

const palm =
  roundedBox(
    4.35,
    0.055,
    0.68,
    0.08,
    aluminum,
    5
  );

palm.position.set(
  0,
  0.20,
  1.02
);

laptop.add(palm);

/* =========================================================
   DISPLAY — REAL HINGE
========================================================= */

const display =
  new THREE.Group();

/*
   THIS is the actual hinge pivot.
   Everything inside display rotates from here.
*/

display.position.set(
  0,
  0.18,
  -1.43
);

display.rotation.x =
  THREE.MathUtils.degToRad(-8);

laptop.add(display);

/* ---------------------------------------------------------
   HINGE CYLINDER
--------------------------------------------------------- */

const hinge =
  new THREE.Mesh(
    new THREE.CylinderGeometry(
      0.11,
      0.11,
      3.35,
      32
    ),
    aluminumDark
  );

hinge.rotation.z =
  Math.PI / 2;

hinge.position.set(
  0,
  0,
  0
);

hinge.castShadow = true;

display.add(hinge);

/* ---------------------------------------------------------
   DISPLAY FRAME
--------------------------------------------------------- */

const displayFrame =
  roundedBox(
    4.62,
    2.78,
    0.20,
    0.15,
    aluminum,
    6
  );

/*
   Important:
   The bottom of the display sits directly
   at the hinge because the group pivot is here.
*/

displayFrame.position.set(
  0,
  1.39,
  0
);

display.add(displayFrame);

/* ---------------------------------------------------------
   BLACK BEZEL
--------------------------------------------------------- */

const bezel =
  roundedBox(
    4.28,
    2.45,
    0.055,
    0.10,
    blackMaterial,
    5
  );

bezel.position.set(
  0,
  1.39,
  0.115
);

display.add(bezel);

/* ---------------------------------------------------------
   SCREEN
--------------------------------------------------------- */

const screenMaterial =
  new THREE.MeshBasicMaterial({
    map:
      createScreenTexture()
  });

const screen =
  makePlane(
    4.02,
    2.18,
    screenMaterial
  );

screen.position.set(
  0,
  1.39,
  0.15
);

display.add(screen);

/* ---------------------------------------------------------
   WEBCAM
--------------------------------------------------------- */

const webcam =
  new THREE.Mesh(
    new THREE.SphereGeometry(
      0.035,
      16,
      16
    ),
    blackMaterial
  );

webcam.position.set(
  0,
  2.48,
  0.16
);

display.add(webcam);

/* ---------------------------------------------------------
   HINGE CAPS
--------------------------------------------------------- */

for (
  const x of [-1.42, 1.42]
) {

  const cap =
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.12,
        0.12,
        0.38,
        24
      ),
      aluminumDark
    );

  cap.rotation.z =
    Math.PI / 2;

  cap.position.set(
    x,
    0,
    0
  );

  display.add(cap);
}

/* ---------------------------------------------------------
   LOGO ON BACK
--------------------------------------------------------- */

const logo =
  new THREE.Mesh(
    new THREE.CircleGeometry(
      0.17,
      32
    ),
    new THREE.MeshStandardMaterial({
      color: 0xf4f7fb,
      metalness: 0.75,
      roughness: 0.2
    })
  );

logo.position.set(
  0,
  1.38,
  -0.115
);

logo.rotation.x =
  Math.PI / 2;

display.add(logo);

/* =========================================================
   PHONE
========================================================= */

const phone =
  new THREE.Group();

phone.position.set(
  2.45,
  0.85,
  0.62
);

phone.rotation.set(
  THREE.MathUtils.degToRad(1),
  THREE.MathUtils.degToRad(-12),
  THREE.MathUtils.degToRad(4)
);

phone.scale.setScalar(
  0.82
);

hero.add(phone);

/* ---------------------------------------------------------
   PHONE BODY
--------------------------------------------------------- */

const phoneBody =
  roundedBox(
    1.48,
    3.15,
    0.22,
    0.19,
    blackMaterial,
    7
  );

phone.add(phoneBody);

/* ---------------------------------------------------------
   PHONE SCREEN
--------------------------------------------------------- */

const phoneScreen =
  roundedBox(
    1.32,
    2.99,
    0.035,
    0.15,
    new THREE.MeshBasicMaterial({
      map:
        createPhoneTexture()
    }),
    6
  );

phoneScreen.position.z =
  0.13;

phone.add(phoneScreen);

/* ---------------------------------------------------------
   DYNAMIC ISLAND
--------------------------------------------------------- */

const island =
  roundedBox(
    0.55,
    0.15,
    0.045,
    0.07,
    blackMaterial,
    5
  );

island.position.set(
  0,
  1.29,
  0.16
);

phone.add(island);

/* ---------------------------------------------------------
   SIDE BUTTONS
--------------------------------------------------------- */

const volumeUp =
  roundedBox(
    0.08,
    0.35,
    0.07,
    0.03,
    silverButton,
    4
  );

volumeUp.position.set(
  -0.76,
  0.58,
  0
);

phone.add(volumeUp);

const volumeDown =
  roundedBox(
    0.08,
    0.35,
    0.07,
    0.03,
    silverButton,
    4
  );

volumeDown.position.set(
  -0.76,
  0.12,
  0
);

phone.add(volumeDown);

const power =
  roundedBox(
    0.08,
    0.52,
    0.07,
    0.03,
    silverButton,
    4
  );

power.position.set(
  0.76,
  0.40,
  0
);

phone.add(power);

/* ---------------------------------------------------------
   CAMERA BUMP
--------------------------------------------------------- */

const cameraBump =
  roundedBox(
    0.62,
    0.73,
    0.13,
    0.13,
    darkMetal,
    6
  );

cameraBump.position.set(
  -0.34,
  0.98,
  -0.18
);

phone.add(cameraBump);

const lensMaterial =
  new THREE.MeshStandardMaterial({
    color: 0x030507,
    metalness: 0.9,
    roughness: 0.1
  });

const lensPositions = [
  [-0.47, 1.18],
  [-0.22, 1.18],
  [-0.47, 0.92]
];

lensPositions.forEach(
  ([x, y]) => {

    const lens =
      new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.095,
          0.095,
          0.035,
          24
        ),
        lensMaterial
      );

    lens.rotation.x =
      Math.PI / 2;

    lens.position.set(
      x,
      y,
      -0.27
    );

    phone.add(lens);
  }
);

/* =========================================================
   GROUND SHADOW
========================================================= */

const shadow =
  new THREE.Mesh(
    new THREE.PlaneGeometry(
      8.5,
      4
    ),
    new THREE.MeshBasicMaterial({
      color: 0x536174,
      transparent: true,
      opacity: 0.13,
      depthWrite: false
    })
  );

shadow.rotation.x =
  -Math.PI / 2;

shadow.position.set(
  0,
  -0.35,
  0
);

hero.add(shadow);

/* =========================================================
   PARTICLES
========================================================= */

const particleCount = 65;

const positions =
  new Float32Array(
    particleCount * 3
  );

for (
  let i = 0;
  i < particleCount;
  i++
) {

  positions[i * 3] =
    (Math.random() - 0.5) * 8;

  positions[i * 3 + 1] =
    Math.random() * 4 - 1;

  positions[i * 3 + 2] =
    (Math.random() - 0.5) * 4;
}

const particleGeometry =
  new THREE.BufferGeometry();

particleGeometry.setAttribute(
  'position',
  new THREE.BufferAttribute(
    positions,
    3
  )
);

const particles =
  new THREE.Points(
    particleGeometry,
    new THREE.PointsMaterial({
      color: 0x9edfff,
      size: 0.018,
      transparent: true,
      opacity: 0.38,
      depthWrite: false
    })
  );

scene.add(particles);

/* =========================================================
   POINTER MOVEMENT
========================================================= */

let pointerX = 0;
let pointerY = 0;

window.addEventListener(
  'pointermove',
  event => {

    pointerX =
      (event.clientX /
        window.innerWidth -
        0.5) * 2;

    pointerY =
      (event.clientY /
        window.innerHeight -
        0.5) * 2;
  },
  { passive: true }
);

/* =========================================================
   RESIZE
========================================================= */

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

/* =========================================================
   VISIBILITY
========================================================= */

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

/* =========================================================
   ANIMATION
========================================================= */

const clock =
  new THREE.Clock();

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
    0.045;

  hero.rotation.y =
    THREE.MathUtils.lerp(
      hero.rotation.y,
      pointerX * 0.045,
      0.035
    );

  hero.rotation.x =
    THREE.MathUtils.lerp(
      hero.rotation.x,
      pointerY * -0.015,
      0.035
    );

  particles.rotation.y =
    t * 0.015;

  renderer.render(
    scene,
    camera
  );
}

stage.classList.add(
  'scene-active'
);

animate();

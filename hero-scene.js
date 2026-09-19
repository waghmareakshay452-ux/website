import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

(() => {
  'use strict';

  const stage = document.getElementById('heroStage');
  const canvas = document.getElementById('heroCanvas');

  if (!stage || !canvas) return;

  // ------------------------------------------------------------
  // BASIC SETUP
  // ------------------------------------------------------------

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    30,
    1,
    0.1,
    100
  );

  camera.position.set(0, 1.8, 10);
  camera.lookAt(0, 1, 0);

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

  // ------------------------------------------------------------
  // LIGHTING
  // ------------------------------------------------------------

  const ambient = new THREE.HemisphereLight(
    0xffffff,
    0xb8c2d8,
    2.2
  );

  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(
    0xffffff,
    4
  );

  keyLight.position.set(4, 7, 7);
  keyLight.castShadow = true;

  keyLight.shadow.mapSize.width = 1024;
  keyLight.shadow.mapSize.height = 1024;

  scene.add(keyLight);

  const rimLight = new THREE.PointLight(
    0x72cfff,
    18,
    14
  );

  rimLight.position.set(-4, 3, 3);

  scene.add(rimLight);

  const purpleLight = new THREE.PointLight(
    0x8c7cff,
    12,
    12
  );

  purpleLight.position.set(4, 2, -1);

  scene.add(purpleLight);

  // ------------------------------------------------------------
  // HERO GROUP
  // ------------------------------------------------------------

  const heroGroup = new THREE.Group();

  heroGroup.position.set(0, -0.2, 0);

  scene.add(heroGroup);

  // ------------------------------------------------------------
  // MATERIALS
  // ------------------------------------------------------------

  const laptopBodyMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xdfe5ef,
    metalness: 0.75,
    roughness: 0.24,
    clearcoat: 0.65,
    clearcoatRoughness: 0.15
  });

  const darkMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x10131a,
    metalness: 0.35,
    roughness: 0.28,
    clearcoat: 0.5
  });

  const keyboardMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xcbd2de,
    metalness: 0.55,
    roughness: 0.3
  });

  const screenFrameMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x11151d,
    metalness: 0.25,
    roughness: 0.2,
    clearcoat: 0.8
  });

  // ------------------------------------------------------------
  // HELPER: ROUNDED BOX
  // ------------------------------------------------------------

  function roundedBox(
    width,
    height,
    depth,
    radius,
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

    shape.lineTo(
      x + width,
      y + height - radius
    );

    shape.quadraticCurveTo(
      x + width,
      y + height,
      x + width - radius,
      y + height
    );

    shape.lineTo(
      x + radius,
      y + height
    );

    shape.quadraticCurveTo(
      x,
      y + height,
      x,
      y + height - radius
    );

    shape.lineTo(
      x,
      y + radius
    );

    shape.quadraticCurveTo(
      x,
      y,
      x + radius,
      y
    );

    const geometry = new THREE.ExtrudeGeometry(
      shape,
      {
        depth,
        bevelEnabled: true,
        bevelSegments: 3,
        bevelSize: 0.035,
        bevelThickness: 0.025
      }
    );

    geometry.center();

    return new THREE.Mesh(
      geometry,
      material
    );
  }

  // ------------------------------------------------------------
  // SCREEN TEXTURE
  // ------------------------------------------------------------

  function createLaptopScreenTexture() {
    const c = document.createElement('canvas');

    c.width = 1200;
    c.height = 760;

    const ctx = c.getContext('2d');

    // Background
    ctx.fillStyle = '#0b0f17';
    ctx.fillRect(0, 0, c.width, c.height);

    // subtle gradient
    const gradient = ctx.createLinearGradient(
      0,
      0,
      c.width,
      c.height
    );

    gradient.addColorStop(0, '#121b2c');
    gradient.addColorStop(0.5, '#101625');
    gradient.addColorStop(1, '#151129');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, c.width, c.height);

    // top bar
    ctx.fillStyle = '#171e2b';
    ctx.fillRect(0, 0, c.width, 72);

    // browser dots
    const dots = [
      '#ff625d',
      '#ffbd44',
      '#00ca4e'
    ];

    dots.forEach((color, i) => {
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.arc(
        32 + i * 25,
        36,
        7,
        0,
        Math.PI * 2
      );
      ctx.fill();
    });

    // Web Craft logo
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Arial';
    ctx.fillText(
      'WEB CRAFT',
      110,
      45
    );

    // navigation
    ctx.fillStyle = '#8994a8';
    ctx.font = '18px Arial';

    ctx.fillText(
      'Work',
      750,
      44
    );

    ctx.fillText(
      'Services',
      830,
      44
    );

    ctx.fillText(
      'Contact',
      945,
      44
    );

    // Main heading
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 64px Arial';

    ctx.fillText(
      'Digital experiences',
      70,
      190
    );

    ctx.fillStyle = '#75cfff';

    ctx.fillText(
      'built to perform.',
      70,
      265
    );

    // description
    ctx.fillStyle = '#8f9aad';
    ctx.font = '22px Arial';

    ctx.fillText(
      'Premium websites + intelligent automation.',
      72,
      320
    );

    // cards
    const cards = [
      {
        x: 70,
        title: 'Design',
        value: '98'
      },
      {
        x: 360,
        title: 'Performance',
        value: '96'
      },
      {
        x: 650,
        title: 'Conversion',
        value: '94'
      }
    ];

    cards.forEach(card => {
      ctx.fillStyle = '#171e2c';

      ctx.roundRect(
        card.x,
        390,
        250,
        180,
        22
      );

      ctx.fill();

      ctx.fillStyle = '#8d98aa';
      ctx.font = '18px Arial';

      ctx.fillText(
        card.title,
        card.x + 25,
        430
      );

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 56px Arial';

      ctx.fillText(
        card.value,
        card.x + 25,
        505
      );

      ctx.fillStyle = '#71cdfc';

      ctx.fillRect(
        card.x + 25,
        535,
        170,
        5
      );
    });

    const texture =
      new THREE.CanvasTexture(c);

    texture.colorSpace =
      THREE.SRGBColorSpace;

    texture.anisotropy =
      renderer.capabilities.getMaxAnisotropy();

    return texture;
  }

  // ------------------------------------------------------------
  // PHONE SCREEN TEXTURE
  // ------------------------------------------------------------

  function createPhoneScreenTexture() {
    const c = document.createElement('canvas');

    c.width = 500;
    c.height = 1000;

    const ctx = c.getContext('2d');

    ctx.fillStyle = '#0b0f17';
    ctx.fillRect(
      0,
      0,
      c.width,
      c.height
    );

    const gradient = ctx.createLinearGradient(
      0,
      0,
      0,
      c.height
    );

    gradient.addColorStop(
      0,
      '#152238'
    );

    gradient.addColorStop(
      1,
      '#100f1e'
    );

    ctx.fillStyle = gradient;

    ctx.fillRect(
      0,
      0,
      c.width,
      c.height
    );

    // logo
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px Arial';

    ctx.fillText(
      'WEB CRAFT',
      45,
      75
    );

    // hero
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 52px Arial';

    ctx.fillText(
      'Build.',
      45,
      190
    );

    ctx.fillStyle = '#73d1ff';

    ctx.fillText(
      'Automate.',
      45,
      255
    );

    ctx.fillStyle = '#8895a9';
    ctx.font = '20px Arial';

    ctx.fillText(
      'Your business,',
      45,
      310
    );

    ctx.fillText(
      'beautifully connected.',
      45,
      340
    );

    // button
    ctx.fillStyle = '#ffffff';

    ctx.roundRect(
      45,
      395,
      240,
      65,
      18
    );

    ctx.fill();

    ctx.fillStyle = '#10131b';
    ctx.font = 'bold 20px Arial';

    ctx.fillText(
      'Free Website Audit',
      72,
      436
    );

    // cards
    for (let i = 0; i < 3; i++) {
      const y = 520 + i * 135;

      ctx.fillStyle = '#181f2d';

      ctx.roundRect(
        45,
        y,
        410,
        100,
        20
      );

      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 21px Arial';

      ctx.fillText(
        [
          'Website Design',
          'Automation',
          'Performance'
        ][i],
        75,
        y + 40
      );

      ctx.fillStyle = '#758298';
      ctx.font = '16px Arial';

      ctx.fillText(
        [
          'Premium digital presence',
          'Smarter business workflows',
          'Fast & optimized'
        ][i],
        75,
        y + 68
      );
    }

    const texture =
      new THREE.CanvasTexture(c);

    texture.colorSpace =
      THREE.SRGBColorSpace;

    texture.anisotropy =
      renderer.capabilities.getMaxAnisotropy();

    return texture;
  }

  // ------------------------------------------------------------
  // LAPTOP
  // ------------------------------------------------------------

  function createLaptop() {
    const laptop = new THREE.Group();

    // Base
    const base = roundedBox(
      5.6,
      3.25,
      0.28,
      0.18,
      laptopBodyMaterial
    );

    base.rotation.x = -Math.PI / 2;

    base.position.y = 0.25;

    base.castShadow = true;
    base.receiveShadow = true;

    laptop.add(base);

    // Keyboard area
    const keyboard = roundedBox(
      4.9,
      2.45,
      0.06,
      0.14,
      keyboardMaterial
    );

    keyboard.rotation.x = -Math.PI / 2;

    keyboard.position.set(
      0,
      0.42,
      0
    );

    keyboard.receiveShadow = true;

    laptop.add(keyboard);

    // Keyboard keys
    const keyMaterial =
      new THREE.MeshPhysicalMaterial({
        color: 0x8f98a6,
        metalness: 0.25,
        roughness: 0.45
      });

    const keyRows = 6;
    const keysPerRow = 12;

    for (let row = 0; row < keyRows; row++) {
      for (
        let col = 0;
        col < keysPerRow;
        col++
      ) {
        const key = roundedBox(
          0.29,
          0.27,
          0.045,
          0.04,
          keyMaterial
        );

        key.rotation.x =
          -Math.PI / 2;

        key.position.x =
          -1.92 + col * 0.35;

        key.position.z =
          -0.78 + row * 0.34;

        key.position.y = 0.48;

        laptop.add(key);
      }
    }

    // Trackpad
    const trackpadMaterial =
      new THREE.MeshPhysicalMaterial({
        color: 0xbfc7d3,
        metalness: 0.35,
        roughness: 0.25
      });

    const trackpad = roundedBox(
      1.55,
      1.0,
      0.035,
      0.12,
      trackpadMaterial
    );

    trackpad.rotation.x =
      -Math.PI / 2;

    trackpad.position.set(
      0,
      0.49,
      0.72
    );

    laptop.add(trackpad);

    // Screen assembly
    const screenAssembly =
      new THREE.Group();

    screenAssembly.position.set(
      0,
      0.42,
      -1.47
    );

    // Screen frame
    const screenFrame = roundedBox(
      5.55,
      3.45,
      0.20,
      0.20,
      screenFrameMaterial
    );

    screenFrame.rotation.x =
      Math.PI / 2;

    screenAssembly.add(screenFrame);

    // Actual screen
    const screenTexture =
      createLaptopScreenTexture();

    const screenMaterial =
      new THREE.MeshBasicMaterial({
        map: screenTexture
      });

    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(
        5.02,
        2.95
      ),
      screenMaterial
    );

    screen.position.z = 0.115;

    screen.rotation.x =
      Math.PI / 2;

    screenAssembly.add(screen);

    // Hinge
    const hinge = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.10,
        0.10,
        4.8,
        24
      ),
      darkMaterial
    );

    hinge.rotation.z =
      Math.PI / 2;

    hinge.position.set(
      0,
      -1.25,
      0
    );

    screenAssembly.add(hinge);

    // Tilt open
    screenAssembly.rotation.x =
      THREE.MathUtils.degToRad(
        -14
      );

    laptop.add(screenAssembly);

    // Logo
    const logo = new THREE.Mesh(
      new THREE.CircleGeometry(
        0.25,
        48
      ),
      new THREE.MeshBasicMaterial({
        color: 0xf7f9ff
      })
    );

    logo.position.set(
      0,
      0.58,
      -0.85
    );

    logo.rotation.x =
      -Math.PI / 2;

    laptop.add(logo);

    laptop.scale.set(
      1.05,
      1.05,
      1.05
    );

    laptop.position.set(
      -0.25,
      0,
      0
    );

    laptop.rotation.y =
      THREE.MathUtils.degToRad(-7);

    return laptop;
  }

  // ------------------------------------------------------------
  // PHONE
  // ------------------------------------------------------------

  function createPhone() {
    const phone = new THREE.Group();

    // Main body
    const body = roundedBox(
      1.65,
      3.35,
      0.28,
      0.20,
      darkMaterial
    );

    body.rotation.x =
      Math.PI / 2;

    phone.add(body);

    // Screen
    const phoneTexture =
      createPhoneScreenTexture();

    const phoneScreenMaterial =
      new THREE.MeshBasicMaterial({
        map: phoneTexture
      });

    const phoneScreen =
      new THREE.Mesh(
        new THREE.PlaneGeometry(
          1.43,
          3.05
        ),
        phoneScreenMaterial
      );

    phoneScreen.rotation.x =
      Math.PI / 2;

    phoneScreen.position.z =
      0.17;

    phone.add(phoneScreen);

    // Camera island
    const cameraIsland =
      roundedBox(
        0.55,
        0.25,
        0.08,
        0.08,
        darkMaterial
      );

    cameraIsland.rotation.x =
      Math.PI / 2;

    cameraIsland.position.set(
      -0.42,
      0,
      -1.39
    );

    phone.add(cameraIsland);

    // Cameras
    const cameraMaterial =
      new THREE.MeshPhysicalMaterial({
        color: 0x020306,
        metalness: 0.7,
        roughness: 0.2
      });

    [-0.17, 0.17].forEach(
      x => {
        const lens =
          new THREE.Mesh(
            new THREE.CylinderGeometry(
              0.065,
              0.065,
              0.04,
              24
            ),
            cameraMaterial
          );

        lens.rotation.x =
          Math.PI / 2;

        lens.position.set(
          -0.42 + x,
          0,
          -1.51
        );

        phone.add(lens);
      }
    );

    // Side buttons
    const buttonMaterial =
      new THREE.MeshPhysicalMaterial({
        color: 0x7e8795,
        metalness: 0.65,
        roughness: 0.25
      });

    const volumeUp =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          0.08,
          0.42,
          0.12
        ),
        buttonMaterial
      );

    volumeUp.position.set(
      -0.88,
      0,
      -0.4
    );

    phone.add(volumeUp);

    const volumeDown =
      volumeUp.clone();

    volumeDown.position.z =
      0.15;

    phone.add(volumeDown);

    phone.position.set(
      3.0,
      0.65,
      0.4
    );

    phone.rotation.set(
      THREE.MathUtils.degToRad(-5),
      THREE.MathUtils.degToRad(-15),
      THREE.MathUtils.degToRad(9)
    );

    phone.scale.setScalar(
      0.88
    );

    return phone;
  }

  // ------------------------------------------------------------
  // ADD DEVICES
  // ------------------------------------------------------------

  const laptop =
    createLaptop();

  const phone =
    createPhone();

  heroGroup.add(laptop);
  heroGroup.add(phone);

  // ------------------------------------------------------------
  // FLOATING SHADOW
  // ------------------------------------------------------------

  const shadowMaterial =
    new THREE.MeshBasicMaterial({
      color: 0x1b2433,
      transparent: true,
      opacity: 0.10,
      depthWrite: false
    });

  const shadow =
    new THREE.Mesh(
      new THREE.CircleGeometry(
        4.4,
        64
      ),
      shadowMaterial
    );

  shadow.scale.set(
    1.8,
    0.45,
    1
  );

  shadow.rotation.x =
    -Math.PI / 2;

  shadow.position.set(
    0,
    -1.55,
    0
  );

  scene.add(shadow);

  // ------------------------------------------------------------
  // PARTICLES
  // ------------------------------------------------------------

  const particleCount = 90;

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
      (Math.random() - 0.5) * 9;

    positions[i * 3 + 1] =
      (Math.random() - 0.5) * 5;

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

  const particleMaterial =
    new THREE.PointsMaterial({
      color: 0x8fcfff,
      size: 0.025,
      transparent: true,
      opacity: 0.45,
      depthWrite: false
    });

  const particles =
    new THREE.Points(
      particleGeometry,
      particleMaterial
    );

  scene.add(particles);

  // ------------------------------------------------------------
  // POINTER INTERACTION
  // ------------------------------------------------------------

  let pointerX = 0;
  let pointerY = 0;

  let targetX = 0;
  let targetY = 0;

  window.addEventListener(
    'pointermove',
    event => {
      pointerX =
        (event.clientX /
          window.innerWidth) *
          2 -
        1;

      pointerY =
        (event.clientY /
          window.innerHeight) *
          2 -
        1;
    },
    { passive: true }
  );

  // ------------------------------------------------------------
  // RESIZE
  // ------------------------------------------------------------

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

  // ------------------------------------------------------------
  // ANIMATION
  // ------------------------------------------------------------

  const clock =
    new THREE.Clock();

  let animationFrame = null;

  function animate() {
    animationFrame =
      requestAnimationFrame(
        animate
      );

    const elapsed =
      clock.getElapsedTime();

    // Smooth pointer
    targetX +=
      (pointerX - targetX) *
      0.035;

    targetY +=
      (pointerY - targetY) *
      0.035;

    // Main floating movement
    heroGroup.position.y =
      -0.2 +
      Math.sin(
        elapsed * 0.85
      ) *
      0.12;

    heroGroup.rotation.y =
      THREE.MathUtils.degToRad(-2) +
      targetX * 0.08;

    heroGroup.rotation.x =
      targetY * 0.035;

    // Laptop movement
    laptop.rotation.y =
      THREE.MathUtils.degToRad(-7) +
      targetX * 0.045;

    laptop.rotation.z =
      Math.sin(
        elapsed * 0.65
      ) * 0.008;

    // Phone movement
    phone.rotation.y =
      THREE.MathUtils.degToRad(-15) +
      targetX * 0.08;

    phone.rotation.z =
      THREE.MathUtils.degToRad(9) +
      Math.sin(
        elapsed * 0.8
      ) * 0.018;

    phone.position.y =
      0.65 +
      Math.sin(
        elapsed * 1.15 +
        1.5
      ) * 0.16;

    // Particles
    particles.rotation.y =
      elapsed * 0.025;

    particles.rotation.x =
      Math.sin(
        elapsed * 0.2
      ) * 0.04;

    renderer.render(
      scene,
      camera
    );
  }

  // ------------------------------------------------------------
  // START
  // ------------------------------------------------------------

  stage.classList.add(
    'scene-active'
  );

  animate();

  // ------------------------------------------------------------
  // CLEANUP WHEN HIDDEN
  // ------------------------------------------------------------

  document.addEventListener(
    'visibilitychange',
    () => {
      if (
        document.hidden
      ) {
        if (
          animationFrame
        ) {
          cancelAnimationFrame(
            animationFrame
          );

          animationFrame = null;
        }
      } else if (
        !animationFrame
      ) {
        animate();
      }
    }
  );

})();

import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

(() => {
  'use strict';

  const stage = document.getElementById('heroStage');
  const canvas = document.getElementById('heroCanvas');

  if (!stage || !canvas) return;

  // ============================================================
  // SCENE
  // ============================================================

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    30,
    1,
    0.1,
    100
  );

  camera.position.set(0, 1.3, 10);
  camera.lookAt(0, 0.8, 0);

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

  // ============================================================
  // LIGHTING
  // ============================================================

  scene.add(
    new THREE.HemisphereLight(
      0xffffff,
      0x9da9bd,
      2.4
    )
  );

  const keyLight = new THREE.DirectionalLight(
    0xffffff,
    4.2
  );

  keyLight.position.set(4, 7, 7);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);

  scene.add(keyLight);

  const blueLight = new THREE.PointLight(
    0x66ccff,
    16,
    14
  );

  blueLight.position.set(-4, 3, 4);
  scene.add(blueLight);

  const violetLight = new THREE.PointLight(
    0x907cff,
    12,
    12
  );

  violetLight.position.set(4, 2, -2);
  scene.add(violetLight);

  // ============================================================
  // MAIN GROUP
  // ============================================================

  const hero = new THREE.Group();

  hero.position.set(0, -0.25, 0);

  scene.add(hero);

  // ============================================================
  // MATERIALS
  // ============================================================

  const silver = new THREE.MeshPhysicalMaterial({
    color: 0xdce2eb,
    metalness: 0.72,
    roughness: 0.22,
    clearcoat: 0.7,
    clearcoatRoughness: 0.12
  });

  const dark = new THREE.MeshPhysicalMaterial({
    color: 0x11151d,
    metalness: 0.4,
    roughness: 0.25,
    clearcoat: 0.65
  });

  const keyboard = new THREE.MeshPhysicalMaterial({
    color: 0xb8c1cf,
    metalness: 0.45,
    roughness: 0.34
  });

  const keyMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x6f7887,
    metalness: 0.2,
    roughness: 0.45
  });

  // ============================================================
  // ROUNDED BOX
  // ============================================================

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

    shape.lineTo(
      x + width - radius,
      y
    );

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

  // ============================================================
  // LAPTOP SCREEN TEXTURE
  // ============================================================

  function laptopTexture() {
    const canvas = document.createElement('canvas');

    canvas.width = 1200;
    canvas.height = 720;

    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0a0e16';
    ctx.fillRect(0, 0, 1200, 720);

    const gradient = ctx.createLinearGradient(
      0,
      0,
      1200,
      720
    );

    gradient.addColorStop(0, '#17243a');
    gradient.addColorStop(0.5, '#0d1423');
    gradient.addColorStop(1, '#181329');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 720);

    // Browser bar
    ctx.fillStyle = '#171d28';
    ctx.fillRect(0, 0, 1200, 58);

    // Browser dots
    ['#ff605c', '#ffbd44', '#00ca4e'].forEach(
      (color, i) => {
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.arc(
          27 + i * 23,
          29,
          6,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    );

    // Logo
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 25px Arial';

    ctx.fillText(
      'WEB CRAFT',
      105,
      37
    );

    // Nav
    ctx.fillStyle = '#8d98aa';
    ctx.font = '16px Arial';

    ctx.fillText('Work', 800, 36);
    ctx.fillText('Services', 865, 36);
    ctx.fillText('Contact', 950, 36);

    // Main heading
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 58px Arial';

    ctx.fillText(
      'Digital experiences',
      65,
      175
    );

    ctx.fillStyle = '#71d0ff';

    ctx.fillText(
      'built to perform.',
      65,
      245
    );

    // Description
    ctx.fillStyle = '#8995a8';
    ctx.font = '20px Arial';

    ctx.fillText(
      'Premium websites + intelligent automation.',
      67,
      292
    );

    // Cards
    const cards = [
      ['Design', '98'],
      ['Performance', '96'],
      ['Conversion', '94']
    ];

    cards.forEach((card, index) => {
      const x = 65 + index * 350;

      ctx.fillStyle = '#171f2d';

      ctx.beginPath();
      ctx.roundRect(
        x,
        360,
        305,
        205,
        22
      );
      ctx.fill();

      ctx.fillStyle = '#8b96a9';
      ctx.font = '17px Arial';

      ctx.fillText(
        card[0],
        x + 25,
        400
      );

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 52px Arial';

      ctx.fillText(
        card[1],
        x + 25,
        470
      );

      ctx.fillStyle = '#6ecfff';

      ctx.fillRect(
        x + 25,
        515,
        210,
        5
      );
    });

    const texture =
      new THREE.CanvasTexture(canvas);

    texture.colorSpace =
      THREE.SRGBColorSpace;

    texture.anisotropy =
      renderer.capabilities.getMaxAnisotropy();

    return texture;
  }

  // ============================================================
  // PHONE TEXTURE
  // ============================================================

  function phoneTexture() {
    const canvas = document.createElement('canvas');

    canvas.width = 500;
    canvas.height = 1000;

    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#090d15';
    ctx.fillRect(0, 0, 500, 1000);

    const gradient = ctx.createLinearGradient(
      0,
      0,
      500,
      1000
    );

    gradient.addColorStop(0, '#15253e');
    gradient.addColorStop(1, '#11101e');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 500, 1000);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 29px Arial';

    ctx.fillText(
      'WEB CRAFT',
      32,
      62
    );

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Arial';

    ctx.fillText(
      'Build.',
      32,
      175
    );

    ctx.fillStyle = '#70ceff';

    ctx.fillText(
      'Automate.',
      32,
      235
    );

    ctx.fillStyle = '#8b96aa';
    ctx.font = '17px Arial';

    ctx.fillText(
      'Beautiful digital systems',
      32,
      285
    );

    ctx.fillText(
      'for ambitious businesses.',
      32,
      312
    );

    // CTA
    ctx.fillStyle = '#ffffff';

    ctx.beginPath();
    ctx.roundRect(
      32,
      360,
      235,
      58,
      17
    );
    ctx.fill();

    ctx.fillStyle = '#0d1119';
    ctx.font = 'bold 17px Arial';

    ctx.fillText(
      'Free Website Audit',
      57,
      397
    );

    const items = [
      'Website Design',
      'Automation',
      'Performance'
    ];

    items.forEach((item, index) => {
      const y = 485 + index * 130;

      ctx.fillStyle = '#181f2c';

      ctx.beginPath();
      ctx.roundRect(
        32,
        y,
        436,
        95,
        19
      );
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 19px Arial';

      ctx.fillText(
        item,
        57,
        y + 38
      );

      ctx.fillStyle = '#758195';
      ctx.font = '15px Arial';

      ctx.fillText(
        'Premium digital experience',
        57,
        y + 65
      );
    });

    const texture =
      new THREE.CanvasTexture(canvas);

    texture.colorSpace =
      THREE.SRGBColorSpace;

    texture.anisotropy =
      renderer.capabilities.getMaxAnisotropy();

    return texture;
  }

  // ============================================================
  // LAPTOP
  // ============================================================

  function createLaptop() {
    const laptop = new THREE.Group();

    // ----------------------------------------------------------
    // BASE
    // ----------------------------------------------------------

    const base = roundedBox(
      5.7,
      3.35,
      0.25,
      0.16,
      silver
    );

    // Base lies horizontally.
    base.position.y = 0;

    base.castShadow = true;
    base.receiveShadow = true;

    laptop.add(base);

    // Keyboard plate
    const keyboardPlate = roundedBox(
      5.0,
      2.55,
      0.055,
      0.12,
      keyboard
    );

    keyboardPlate.position.set(
      0,
      0.145,
      0
    );

    laptop.add(keyboardPlate);

    // ----------------------------------------------------------
    // KEYS
    // ----------------------------------------------------------

    const rows = 6;
    const columns = 12;

    for (let row = 0; row < rows; row++) {
      for (
        let column = 0;
        column < columns;
        column++
      ) {
        const key = roundedBox(
          0.30,
          0.26,
          0.045,
          0.035,
          keyMaterial
        );

        key.position.set(
          -1.92 + column * 0.35,
          0.19,
          -0.82 + row * 0.34
        );

        key.castShadow = true;

        laptop.add(key);
      }
    }

    // Space bar
    const space = roundedBox(
      1.65,
      0.26,
      0.045,
      0.035,
      keyMaterial
    );

    space.position.set(
      0,
      0.20,
      0.87
    );

    laptop.add(space);

    // Trackpad
    const trackpad = roundedBox(
      1.55,
      0.95,
      0.035,
      0.10,
      new THREE.MeshPhysicalMaterial({
        color: 0xc6ced9,
        metalness: 0.3,
        roughness: 0.25
      })
    );

    trackpad.position.set(
      0,
      0.20,
      1.00
    );

    laptop.add(trackpad);

    // ----------------------------------------------------------
    // DISPLAY HINGE
    // ----------------------------------------------------------

    const display = new THREE.Group();

    // Put hinge at back of base.
    display.position.set(
      0,
      0.13,
      -1.50
    );

    // ----------------------------------------------------------
    // SCREEN FRAME
    // ----------------------------------------------------------

    const frame = roundedBox(
      5.55,
      3.55,
      0.20,
      0.18,
      dark
    );

    // IMPORTANT:
    // The display is vertical in XY plane.
    frame.position.set(
      0,
      1.68,
      0
    );

    frame.castShadow = true;

    display.add(frame);

    // ----------------------------------------------------------
    // SCREEN
    // ----------------------------------------------------------

    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(
        5.02,
        2.98
      ),
      new THREE.MeshBasicMaterial({
        map: laptopTexture()
      })
    );

    screen.position.set(
      0,
      1.68,
      0.115
    );

    display.add(screen);

    // ----------------------------------------------------------
    // CAMERA / WEBCAM
    // ----------------------------------------------------------

    const webcam = new THREE.Mesh(
      new THREE.CircleGeometry(
        0.035,
        24
      ),
      new THREE.MeshBasicMaterial({
        color: 0x384152
      })
    );

    webcam.position.set(
      0,
      3.12,
      0.125
    );

    display.add(webcam);

    // ----------------------------------------------------------
    // HINGE
    // ----------------------------------------------------------

    const hinge = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.10,
        0.10,
        4.7,
        24
      ),
      dark
    );

    hinge.rotation.z =
      Math.PI / 2;

    hinge.position.set(
      0,
      0,
      0
    );

    display.add(hinge);

    // Open laptop angle.
    display.rotation.x =
      THREE.MathUtils.degToRad(-8);

    laptop.add(display);

    // ----------------------------------------------------------
    // LAPTOP LOGO
    // ----------------------------------------------------------

    const logo = new THREE.Mesh(
      new THREE.CircleGeometry(
        0.24,
        48
      ),
      new THREE.MeshBasicMaterial({
        color: 0xf5f7fb
      })
    );

    logo.position.set(
      0,
      0.145,
      1.12
    );

    logo.rotation.x =
      -Math.PI / 2;

    laptop.add(logo);

    laptop.scale.setScalar(0.94);

    laptop.position.set(
      -0.35,
      0.05,
      0
    );

    laptop.rotation.y =
      THREE.MathUtils.degToRad(-6);

    return laptop;
  }

  // ============================================================
  // PHONE
  // ============================================================

  function createPhone() {
    const phone = new THREE.Group();

    // IMPORTANT:
    // Phone stays in XY plane.
    // DO NOT rotate it 90 degrees.
    const body = roundedBox(
      1.55,
      3.30,
      0.25,
      0.20,
      dark
    );

    body.position.set(
      0,
      0,
      0
    );

    body.castShadow = true;

    phone.add(body);

    // ----------------------------------------------------------
    // FRONT SCREEN
    // ----------------------------------------------------------

    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(
        1.34,
        3.00
      ),
      new THREE.MeshBasicMaterial({
        map: phoneTexture()
      })
    );

    screen.position.z =
      0.145;

    phone.add(screen);

    // ----------------------------------------------------------
    // TOP CAMERA / DYNAMIC ISLAND
    // ----------------------------------------------------------

    const island = roundedBox(
      0.55,
      0.15,
      0.035,
      0.07,
      new THREE.MeshPhysicalMaterial({
        color: 0x030406,
        roughness: 0.15,
        metalness: 0.2
      })
    );

    island.position.set(
      0,
      1.36,
      0.165
    );

    phone.add(island);

    // ----------------------------------------------------------
    // BACK CAMERA BUMP
    // ----------------------------------------------------------

    const backCamera = roundedBox(
      0.62,
      0.52,
      0.08,
      0.11,
      dark
    );

    backCamera.position.set(
      -0.39,
      1.22,
      -0.17
    );

    phone.add(backCamera);

    const lensMaterial =
      new THREE.MeshPhysicalMaterial({
        color: 0x020305,
        metalness: 0.75,
        roughness: 0.15
      });

    [-0.13, 0.13].forEach(offset => {
      const lens = new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.075,
          0.075,
          0.035,
          24
        ),
        lensMaterial
      );

      lens.rotation.x =
        Math.PI / 2;

      lens.position.set(
        -0.39 + offset,
        1.25,
        -0.23
      );

      phone.add(lens);
    });

    // ----------------------------------------------------------
    // SIDE BUTTONS
    // ----------------------------------------------------------

    const buttonMaterial =
      new THREE.MeshPhysicalMaterial({
        color: 0x7c8593,
        metalness: 0.7,
        roughness: 0.22
      });

    const button1 = new THREE.Mesh(
      new THREE.BoxGeometry(
        0.06,
        0.42,
        0.10
      ),
      buttonMaterial
    );

    button1.position.set(
      -0.81,
      0.55,
      0
    );

    phone.add(button1);

    const button2 = button1.clone();

    button2.position.y =
      0.05;

    phone.add(button2);

    // ----------------------------------------------------------
    // POSITION PHONE NEXT TO LAPTOP
    // ----------------------------------------------------------

    phone.position.set(
      2.75,
      0.85,
      0.45
    );

    phone.rotation.set(
      THREE.MathUtils.degToRad(3),
      THREE.MathUtils.degToRad(-10),
      THREE.MathUtils.degToRad(8)
    );

    phone.scale.setScalar(
      0.82
    );

    return phone;
  }

  // ============================================================
  // DEVICES
  // ============================================================

  const laptop = createLaptop();
  const phone = createPhone();

  hero.add(laptop);
  hero.add(phone);

  // ============================================================
  // GROUND SHADOW
  // ============================================================

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(
      3.8,
      64
    ),
    new THREE.MeshBasicMaterial({
      color: 0x1a2434,
      transparent: true,
      opacity: 0.12,
      depthWrite: false
    })
  );

  shadow.scale.set(
    1.75,
    0.40,
    1
  );

  shadow.rotation.x =
    -Math.PI / 2;

  shadow.position.set(
    0,
    -1.35,
    0
  );

  scene.add(shadow);

  // ============================================================
  // PARTICLES
  // ============================================================

  const particleCount = 70;

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

  const particles =
    new THREE.Points(
      particleGeometry,
      new THREE.PointsMaterial({
        color: 0x8bcfff,
        size: 0.025,
        transparent: true,
        opacity: 0.4,
        depthWrite: false
      })
    );

  scene.add(particles);

  // ============================================================
  // MOUSE / POINTER
  // ============================================================

  let pointerX = 0;
  let pointerY = 0;

  let smoothX = 0;
  let smoothY = 0;

  window.addEventListener(
    'pointermove',
    event => {
      pointerX =
        event.clientX /
          window.innerWidth *
          2 -
        1;

      pointerY =
        event.clientY /
          window.innerHeight *
          2 -
        1;
    },
    { passive: true }
  );

  // ============================================================
  // RESIZE
  // ============================================================

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

  // ============================================================
  // ANIMATION
  // ============================================================

  const clock =
    new THREE.Clock();

  let animationFrame = null;

  function animate() {
    animationFrame =
      requestAnimationFrame(
        animate
      );

    const time =
      clock.getElapsedTime();

    smoothX +=
      (pointerX - smoothX) *
      0.035;

    smoothY +=
      (pointerY - smoothY) *
      0.035;

    // Floating
    hero.position.y =
      -0.25 +
      Math.sin(time * 0.8) *
      0.10;

    // Main parallax
    hero.rotation.y =
      smoothX * 0.065;

    hero.rotation.x =
      smoothY * 0.025;

    // Laptop breathing
    laptop.rotation.y =
      THREE.MathUtils.degToRad(-6) +
      smoothX * 0.035;

    laptop.rotation.z =
      Math.sin(time * 0.6) *
      0.006;

    // Phone floating separately
    phone.position.y =
      0.85 +
      Math.sin(time * 1.05) *
      0.13;

    phone.rotation.y =
      THREE.MathUtils.degToRad(-10) +
      smoothX * 0.06;

    phone.rotation.z =
      THREE.MathUtils.degToRad(8) +
      Math.sin(time * 0.75) *
      0.012;

    // Particles
    particles.rotation.y =
      time * 0.018;

    renderer.render(
      scene,
      camera
    );
  }

  // ============================================================
  // START
  // ============================================================

  stage.classList.add(
    'scene-active'
  );

  animate();

  // ============================================================
  // VISIBILITY
  // ============================================================

  document.addEventListener(
    'visibilitychange',
    () => {
      if (document.hidden) {
        if (animationFrame) {
          cancelAnimationFrame(
            animationFrame
          );

          animationFrame = null;
        }
      } else if (!animationFrame) {
        animate();
      }
    }
  );

})();

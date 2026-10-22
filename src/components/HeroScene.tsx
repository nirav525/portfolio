import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

/**
 * A small 3D model of the dispatch story: a depot, four technician routes, and
 * a fleet that grows from 15 to 28 machines while the same vans keep
 * serving it. Purely illustrative; positions are random, not real locations.
 */

const START = 15;
const TOTAL = 28;
const PALETTE = [0x0f766e, 0x1d4ed8, 0xb45309, 0x6d28d9];
const CENTERS: [number, number][] = [[-5.2, -3.4], [5.4, -3.8], [5.0, 5.2], [-4.6, 5.6]];

function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const easeOutBack = (x: number) => 1 + 2.70158 * Math.pow(x - 1, 3) + 1.70158 * Math.pow(x - 1, 2);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

type Machine = { cluster: number; pos: THREE.Vector3; order: number };

function buildMachines(): Machine[] {
  const r = rng(11);
  const out: Machine[] = [];
  // Round-robin so the first 15 are spread over all four clusters and the next 13 fill in.
  const taken: THREE.Vector3[] = [];
  for (let i = 0; i < TOTAL; i++) {
    const cluster = i % 4;
    const [cx, cz] = CENTERS[cluster];
    let p = new THREE.Vector3();
    for (let tries = 0; tries < 60; tries++) {
      const a = r() * Math.PI * 2;
      const d = 0.9 + r() * 2.6;
      p = new THREE.Vector3(cx + Math.cos(a) * d, 0, cz + Math.sin(a) * d);
      if (taken.every((q) => q.distanceTo(p) > 1.15) && p.length() > 2.2) break;
    }
    taken.push(p);
    out.push({ cluster, pos: p, order: i });
  }
  return out;
}

function tourCurve(depot: THREE.Vector3, ms: Machine[]) {
  const left = ms.map((m) => m.pos.clone());
  const pts: THREE.Vector3[] = [depot.clone()];
  let cur = depot.clone();
  while (left.length) {
    let bi = 0;
    for (let i = 1; i < left.length; i++) if (left[i].distanceTo(cur) < left[bi].distanceTo(cur)) bi = i;
    cur = left.splice(bi, 1)[0];
    pts.push(cur.clone());
  }
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p.x, 0.07, p.z)), true, 'centripetal');
  return curve;
}

function gridTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 1024;
  const g = c.getContext('2d')!;
  g.strokeStyle = 'rgba(15,118,110,0.22)';
  g.lineWidth = 2;
  for (let i = 0; i <= 1024; i += 64) {
    g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 1024); g.stroke();
    g.beginPath(); g.moveTo(0, i); g.lineTo(1024, i); g.stroke();
  }
  g.globalCompositeOperation = 'destination-in';
  const rad = g.createRadialGradient(512, 512, 40, 512, 512, 512);
  rad.addColorStop(0, 'rgba(0,0,0,1)');
  rad.addColorStop(0.55, 'rgba(0,0,0,0.7)');
  rad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = rad;
  g.fillRect(0, 0, 1024, 1024);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}

export default function HeroScene() {
  const host = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(START);
  const [ok, setOk] = useState(true);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const kick = useRef<() => void>(() => {});

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    // Reduced-motion visitors skip the build-up and the camera sway, but the vans still
    // drive (slowly), and everyone gets a pause button.
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    } catch {
      setOk(false);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.cssText = 'width:100%;height:100%;display:block';
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    const world = new THREE.Group();
    scene.add(world);

    scene.add(new THREE.HemisphereLight(0xffffff, 0xcfd9d4, 1.15));
    const sun = new THREE.DirectionalLight(0xffffff, 1.5);
    sun.position.set(7, 12, 5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 40 });
    sun.shadow.radius = 5;
    scene.add(sun);

    // Ground: a faded grid, plus a shadow-catching plane.
    const grid = new THREE.Mesh(
      new THREE.PlaneGeometry(34, 34),
      new THREE.MeshBasicMaterial({ map: gridTexture(), transparent: true, depthWrite: false }),
    );
    grid.rotation.x = -Math.PI / 2;
    world.add(grid);
    const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(34, 34), new THREE.ShadowMaterial({ opacity: 0.16 }));
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0.002;
    shadowPlane.receiveShadow = true;
    world.add(shadowPlane);

    // Depot.
    const ink = new THREE.MeshStandardMaterial({ color: 0x14202a, roughness: 0.5 });
    const depot = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.85, 0.5, 32), ink);
    depot.position.y = 0.25;
    depot.castShadow = true;
    world.add(depot);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.0, 1.06, 64),
      new THREE.MeshBasicMaterial({ color: 0x14202a, transparent: true, opacity: 0.35, side: THREE.DoubleSide }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.01;
    world.add(ring);

    // Machines.
    const machines = buildMachines();
    const bodyGeo = new THREE.BoxGeometry(0.62, 1, 0.52);
    const capGeo = new THREE.BoxGeometry(0.66, 0.12, 0.56);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55 });
    const meshes = machines.map((m) => {
      const g = new THREE.Group();
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.5;
      body.castShadow = true;
      const cap = new THREE.Mesh(capGeo, new THREE.MeshStandardMaterial({ color: PALETTE[m.cluster], roughness: 0.4 }));
      cap.position.y = 1.05;
      cap.castShadow = true;
      g.add(body, cap);
      g.position.copy(m.pos);
      g.rotation.y = (m.cluster * Math.PI) / 2 + 0.4;
      g.scale.setScalar(m.order < START ? 1 : 0.0001);
      world.add(g);
      return g;
    });
    const machineScale = 0.78;
    meshes.forEach((g, i) => { if (machines[i].order < START) g.scale.setScalar(machineScale); });

    // Routes: before (15 machines) and after (28), both as soft tubes.
    const routeSets = [START, TOTAL].map((upTo) =>
      [0, 1, 2, 3].map((c) => {
        const curve = tourCurve(new THREE.Vector3(0, 0, 0), machines.filter((m) => m.cluster === c && m.order < upTo));
        const mat = new THREE.MeshBasicMaterial({ color: PALETTE[c], transparent: true, opacity: upTo === START ? 0.75 : 0 });
        const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 220, 0.035, 6, true), mat);
        world.add(tube);
        return { curve, mat };
      }),
    );

    // Vans: cargo box, cab, windshield, wheels. Built along +z so lookAt() points the nose forward.
    const glass = new THREE.MeshStandardMaterial({ color: 0x1d2a38, roughness: 0.2, metalness: 0.2 });
    const tyre = new THREE.MeshStandardMaterial({ color: 0x14202a, roughness: 0.8 });
    const cabMat = new THREE.MeshStandardMaterial({ color: 0xf4f6f5, roughness: 0.4 });
    const cargoGeo = new THREE.BoxGeometry(0.5, 0.46, 0.66);
    const cabGeo = new THREE.BoxGeometry(0.5, 0.32, 0.34);
    const glassGeo = new THREE.BoxGeometry(0.42, 0.15, 0.02);
    const wheelGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.07, 14);
    wheelGeo.rotateZ(Math.PI / 2);
    const vans = [0, 1, 2, 3].map((c) => {
      const v = new THREE.Group();
      const cargo = new THREE.Mesh(cargoGeo, new THREE.MeshStandardMaterial({ color: PALETTE[c], roughness: 0.35 }));
      cargo.position.set(0, 0.36, -0.12);
      const cab = new THREE.Mesh(cabGeo, cabMat);
      cab.position.set(0, 0.28, 0.38);
      const ws = new THREE.Mesh(glassGeo, glass);
      ws.position.set(0, 0.34, 0.555);
      v.add(cargo, cab, ws);
      for (const [x, z] of [[-0.26, 0.3], [0.26, 0.3], [-0.26, -0.28], [0.26, -0.28]]) {
        const w = new THREE.Mesh(wheelGeo, tyre);
        w.position.set(x, 0.1, z);
        v.add(w);
      }
      v.traverse((o) => { o.castShadow = true; });
      world.add(v);
      return v;
    });

    // Sizing.
    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      const back = 1 + Math.max(0, 1.15 - camera.aspect) * 0.9;
      camera.position.set(20 * back, 17 * back, 20 * back);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    // Pointer parallax.
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e: PointerEvent) => {
      const b = el.getBoundingClientRect();
      mouse.tx = ((e.clientX - b.left) / b.width - 0.5) * 2;
      mouse.ty = ((e.clientY - b.top) / b.height - 0.5) * 2;
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    // State for the animation.
    const GROW_AT = 2.2, GROW_STEP = 0.16, SWAP_AT = GROW_AT + 13 * GROW_STEP + 0.9;
    let shown = START;
    let visible = true;
    let raf = 0;
    let last = performance.now();
    let t = calm ? 99 : 0; // scene timeline: machines growing, routes swapping
    let vt = 0; // van clock

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!calm) t += dt;
      vt += dt;

      // Grow the new machines in sequence.
      let n = START;
      meshes.forEach((g, i) => {
        const m = machines[i];
        if (m.order < START) return;
        const k = clamp01((t - GROW_AT - (m.order - START) * GROW_STEP) / 0.6);
        g.scale.setScalar(Math.max(0.0001, easeOutBack(k) * machineScale));
        if (k > 0.45) n++;
      });
      if (n !== shown) { shown = n; setCount(n); }

      // Swap the route set once the fleet is complete.
      const sw = clamp01((t - SWAP_AT) / 1.2);
      routeSets[0].forEach((r) => (r.mat.opacity = 0.75 * (1 - sw)));
      routeSets[1].forEach((r) => (r.mat.opacity = 0.75 * sw));

      // Vans ride whichever set is current.
      vans.forEach((v, c) => {
        const set = routeSets[sw > 0.5 ? 1 : 0][c];
        const speed = (0.055 + c * 0.006) * (calm ? 0.55 : 1); // laps per second: ~18s a lap, ~30s when calm
        const u = ((vt * speed + c * 0.25) % 1 + 1) % 1;
        const p = set.curve.getPointAt(u);
        const tan = set.curve.getTangentAt(u);
        v.position.set(p.x, 0, p.z);
        v.lookAt(p.x + tan.x, 0, p.z + tan.z);
      });

      ring.scale.setScalar(1 + 0.08 * Math.sin(t * 2));
      (ring.material as THREE.MeshBasicMaterial).opacity = 0.25 + 0.15 * Math.sin(t * 2 + 1);

      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;
      world.rotation.y = calm ? -0.5 : -0.5 + Math.sin(t * 0.12) * 0.22 + mouse.x * 0.28;
      world.rotation.x = calm ? 0 : mouse.y * 0.05;

      renderer.render(scene, camera);
      if (!pausedRef.current && visible && !document.hidden) raf = requestAnimationFrame(frame);
    };

    const start = () => { cancelAnimationFrame(raf); last = performance.now(); raf = requestAnimationFrame(frame); };
    kick.current = start;
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !pausedRef.current) start();
    });
    io.observe(el);
    const onVis = () => { if (!document.hidden && visible && !pausedRef.current) start(); };
    document.addEventListener('visibilitychange', onVis);
    start();
    if (calm) setCount(TOTAL);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pointermove', onMove);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose()); else mat?.dispose();
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div className="hs">
      <div className="hs-canvas" ref={host} aria-hidden="true" />
      {ok && (
        <div className="hs-hud" aria-hidden="true">
          <span className="hs-num">{count}</span>
          <span className="hs-cap">machines in the fleet,<br />served by the same technician team</span>
        </div>
      )}
      {ok && (
        <button
          type="button"
          className="hs-pause"
          aria-pressed={paused}
          onClick={() => {
            const next = !pausedRef.current;
            pausedRef.current = next;
            setPaused(next);
            if (!next) kick.current();
          }}
        >
          {paused ? 'Play animation' : 'Pause animation'}
        </button>
      )}
    </div>
  );
}

import { useMemo, useRef } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { UniverseConfig } from '@/types';
import { universeColorVector, type UniverseData } from '@/lib/viz/universe';

function ParticleCloud({
  data,
  config,
  hovered,
  selected,
  onHover,
  onSelect,
}: {
  data: UniverseData;
  config: UniverseConfig;
  hovered: number | null;
  selected: number | null;
  onHover: (index: number | null) => void;
  onSelect: (index: number) => void;
}) {
  const group = useRef<THREE.Group>(null);

  const geometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(data.particles.length * 3);
    const colors = new Float32Array(data.particles.length * 3);
    data.particles.forEach((particle, index) => {
      positions[index * 3] = particle.position[0];
      positions[index * 3 + 1] = particle.position[1];
      positions[index * 3 + 2] = particle.position[2];
      const [r, g, b] = universeColorVector(particle.color);
      colors[index * 3] = r;
      colors[index * 3 + 1] = g;
      colors[index * 3 + 2] = b;
    });
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.computeBoundingSphere();
    return geometry;
  }, [data]);

  const connectionGeometry = useMemo(() => {
    if (!config.showConnections || data.particles.length < 3 || data.particles.length > 400) return null;
    const points: number[] = [];
    data.particles.slice(0, 400).forEach((particle, index) => {
      if (index === 0) return;
      const previous = data.particles[index - 1];
      points.push(...previous.position, ...particle.position);
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    return geometry;
  }, [config.showConnections, data]);

  useFrame((_, delta) => {
    if (group.current && config.animate && (config.mode === 'orbit' || config.mode === 'radial')) {
      group.current.rotation.y += delta * 0.08;
    }
  });

  const handleMove = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    if (typeof event.index === 'number') onHover(event.index);
  };

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (typeof event.index === 'number') onSelect(event.index);
  };

  const highlighted = hovered ?? selected;

  return (
    <group ref={group}>
      {connectionGeometry && (
        <lineSegments geometry={connectionGeometry}>
          <lineBasicMaterial color="#2a5a72" transparent opacity={0.22} />
        </lineSegments>
      )}
      <points
        geometry={geometry}
        onPointerMove={handleMove}
        onPointerOut={() => onHover(null)}
        onClick={handleClick}
      >
        <pointsMaterial
          vertexColors
          size={config.pointSize * 0.12}
          sizeAttenuation
          transparent
          opacity={config.opacity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      {highlighted !== null && data.particles[highlighted] && (
        <mesh position={data.particles[highlighted].position}>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.9} />
        </mesh>
      )}
    </group>
  );
}

function Axes() {
  return (
    <group position={[0, -4.2, 0]}>
      <gridHelper args={[24, 24, '#1e2b38', '#121820']} />
      <mesh rotation={[0, 0, Math.PI / 2]} position={[-5.5, 0.01, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 11, 6]} />
        <meshBasicMaterial color="#1f6f80" transparent opacity={0.6} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.01, -5.5]}>
        <cylinderGeometry args={[0.015, 0.015, 11, 6]} />
        <meshBasicMaterial color="#4b3f9a" transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

export function UniverseScene({
  data,
  config,
  hovered,
  selected,
  onHover,
  onSelect,
  cameraKey,
}: {
  data: UniverseData;
  config: UniverseConfig;
  hovered: number | null;
  selected: number | null;
  onHover: (index: number | null) => void;
  onSelect: (index: number) => void;
  cameraKey: number;
}) {
  return (
    <Canvas
      key={cameraKey}
      camera={{ position: [12, 8, 14], fov: 52, near: 0.1, far: 200 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true }}
      onPointerMissed={() => onHover(null)}
      className="surface-grid"
    >
      <color attach="background" args={['#080a0d']} />
      <fog attach="fog" args={['#080a0d', 18, 52]} />
      <ambientLight intensity={0.7} />
      <pointLight position={[8, 12, 8]} intensity={35} color="#67e8f9" />
      <pointLight position={[-10, -4, -8]} intensity={22} color="#8b7cf6" />
      {config.showGrid && <Axes />}
      <ParticleCloud
        data={data}
        config={config}
        hovered={hovered}
        selected={selected}
        onHover={onHover}
        onSelect={onSelect}
      />
      <OrbitControls enableDamping dampingFactor={0.08} minDistance={4} maxDistance={60} />
    </Canvas>
  );
}

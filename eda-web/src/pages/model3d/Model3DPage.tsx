import React, { useRef, useState, useCallback, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Environment } from "@react-three/drei";
import { useMutation } from "@tanstack/react-query";
import { Upload, Download, Box } from "lucide-react";
import { GlassCard, Spinner } from "@finefab/ui";
import { api } from "../../lib/api";
import * as THREE from "three";

// Minimal STL loader implementation
function parseSTL(buffer: ArrayBuffer): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  try {
    const view = new DataView(buffer);
    const numTriangles = view.getUint32(80, true);
    const expectedSize = 84 + numTriangles * 50;
    if (buffer.byteLength === expectedSize && numTriangles > 0) {
      const positions: number[] = [];
      const normals: number[] = [];
      for (let i = 0; i < numTriangles; i++) {
        const offset = 84 + i * 50;
        const nx = view.getFloat32(offset, true);
        const ny = view.getFloat32(offset + 4, true);
        const nz = view.getFloat32(offset + 8, true);
        for (let v = 0; v < 3; v++) {
          const vOffset = offset + 12 + v * 12;
          positions.push(
            view.getFloat32(vOffset, true),
            view.getFloat32(vOffset + 4, true),
            view.getFloat32(vOffset + 8, true)
          );
          normals.push(nx, ny, nz);
        }
      }
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
      return geometry;
    }
  } catch {
    // fall through to ASCII
  }

  // ASCII STL fallback
  const text = new TextDecoder().decode(buffer);
  const positions: number[] = [];
  const normals: number[] = [];
  const normalRe = /facet normal\s+([\d.eE+-]+)\s+([\d.eE+-]+)\s+([\d.eE+-]+)/g;
  const vertexRe = /vertex\s+([\d.eE+-]+)\s+([\d.eE+-]+)\s+([\d.eE+-]+)/g;
  let nm: RegExpExecArray | null;
  let vm: RegExpExecArray | null;
  while ((nm = normalRe.exec(text)) !== null) {
    const nx = parseFloat(nm[1]);
    const ny = parseFloat(nm[2]);
    const nz = parseFloat(nm[3]);
    for (let v = 0; v < 3; v++) {
      vm = vertexRe.exec(text);
      if (vm) {
        positions.push(parseFloat(vm[1]), parseFloat(vm[2]), parseFloat(vm[3]));
        normals.push(nx, ny, nz);
      }
    }
  }
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  return geometry;
}

function STLModel({ geometry }: { geometry: THREE.BufferGeometry }) {
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color="#00ff88" metalness={0.3} roughness={0.5} />
    </mesh>
  );
}

export function Model3DPage() {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [exportPath, setExportPath] = useState("");
  const [exportFormat, setExportFormat] = useState<"step" | "stl">("step");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportMutation = useMutation({
    mutationFn: ({ path, format }: { path: string; format: "step" | "stl" }) =>
      api.freecadExport(path, format),
  });

  const loadSTL = useCallback((file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "stl") {
      alert("Only STL files are supported for 3D preview.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result;
      if (buffer instanceof ArrayBuffer) {
        const geo = parseSTL(buffer);
        geo.computeBoundingBox();
        geo.center();
        setGeometry(geo);
        setFileName(file.name);
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) loadSTL(file);
    },
    [loadSTL]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) loadSTL(file);
    },
    [loadSTL]
  );

  return (
    <div className="flex flex-col gap-4 overflow-y-auto p-6">
      <h1 className="text-lg font-semibold">3D Model Viewer</h1>

      {/* Upload */}
      <GlassCard>
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => fileInputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-6 transition-colors ${
            isDragging
              ? "border-accent-green bg-accent-green/5 text-accent-green"
              : "border-border-glass text-text-muted hover:border-accent-green/50 hover:text-text-primary"
          }`}
        >
          <Box size={32} />
          <div className="text-center">
            <p className="text-sm font-medium">
              {fileName ? fileName : "Drag & drop an STL file"}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              {fileName ? "Click to load another file" : ".stl binary or ASCII"}
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".stl"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </GlassCard>

      {/* 3D canvas */}
      <GlassCard className="overflow-hidden p-0">
        <div style={{ height: "50vh" }} className="relative rounded-lg">
          <Canvas
            camera={{ position: [5, 5, 5], fov: 50 }}
            shadows
            gl={{ antialias: true }}
          >
            <ambientLight intensity={0.4} />
            <directionalLight
              position={[10, 10, 5]}
              intensity={1}
              castShadow
            />
            <pointLight position={[-10, -10, -10]} intensity={0.5} />
            <Suspense fallback={null}>
              {geometry && <STLModel geometry={geometry} />}
              <Environment preset="city" />
            </Suspense>
            <Grid
              args={[20, 20]}
              cellSize={0.5}
              cellThickness={0.5}
              cellColor="#1a1a2e"
              sectionSize={2}
              sectionThickness={1}
              sectionColor="#00ff8830"
              fadeDistance={25}
              fadeStrength={1}
              followCamera={false}
              infiniteGrid
            />
            <OrbitControls
              makeDefault
              enablePan
              enableZoom
              enableRotate
              minDistance={1}
              maxDistance={50}
            />
          </Canvas>
          {!geometry && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <p className="text-sm text-text-dim">No model loaded — upload an STL above</p>
            </div>
          )}
        </div>
      </GlassCard>

      {/* FreeCAD Export */}
      <GlassCard>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-muted">
          FreeCAD Export
        </h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="FreeCAD project path…"
            value={exportPath}
            onChange={(e) => setExportPath(e.target.value)}
            className="flex-1 rounded-lg border border-border-glass bg-surface-card px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-green focus:outline-none"
          />
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as "step" | "stl")}
            className="rounded-lg border border-border-glass bg-surface-card px-3 py-2 text-sm text-text-primary focus:border-accent-green focus:outline-none"
          >
            <option value="step">STEP</option>
            <option value="stl">STL</option>
          </select>
          <button
            onClick={() =>
              exportPath.trim() &&
              exportMutation.mutate({ path: exportPath, format: exportFormat })
            }
            disabled={!exportPath.trim() || exportMutation.isPending}
            className="flex items-center gap-2 rounded-lg bg-accent-green/10 px-4 py-2 text-sm font-medium text-accent-green transition-colors hover:bg-accent-green/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {exportMutation.isPending ? (
              <Spinner />
            ) : (
              <>
                <Download size={16} />
                Export
              </>
            )}
          </button>
        </div>

        {exportMutation.isError && (
          <p className="mt-3 text-sm text-accent-red">
            Export failed: {(exportMutation.error as Error).message}
          </p>
        )}

        {exportMutation.data && (
          <div className="mt-3 flex items-center gap-3">
            <p className="text-sm text-accent-green">Export complete</p>
            <a
              href={exportMutation.data.url}
              download
              className="flex items-center gap-1 text-xs text-accent-blue hover:underline"
            >
              <Upload size={12} />
              Download {exportMutation.data.format.toUpperCase()}
            </a>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

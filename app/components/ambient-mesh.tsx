export function AmbientMesh() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-y-0 -inset-x-8 -z-10 overflow-hidden"
    >
      <div className="aura-blob-1 absolute -left-40 -top-32 size-[42rem] rounded-full bg-aura-mesh-rose opacity-50 blur-3xl" />
      <div className="aura-blob-2 absolute -right-40 top-10 size-[36rem] rounded-full bg-aura-mesh-violet opacity-45 blur-3xl" />
      <div className="aura-blob-3 absolute -bottom-40 left-1/3 size-[40rem] rounded-full bg-aura-mesh-amber opacity-35 blur-3xl" />
    </div>
  );
}

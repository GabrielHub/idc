export type AmbientMeshContainment = "fixed" | "absolute";

/**
 * `containment="absolute"` anchors the mesh to its nearest positioned ancestor
 * instead of the viewport. Use it whenever the mesh sits inside an ancestor
 * that animates `transform` (scale/translate) — a transformed ancestor becomes
 * the containing block for `fixed` descendants, so the mesh would otherwise
 * jump bounds when the transform resolves to identity.
 */
export function AmbientMesh({
  containment = "fixed",
}: {
  containment?: AmbientMeshContainment;
} = {}) {
  const positionClass =
    containment === "absolute" ? "absolute inset-0" : "fixed inset-y-0 -inset-x-8";
  return (
    <div aria-hidden className={`pointer-events-none ${positionClass} -z-10 overflow-hidden`}>
      <div className="aura-blob-1 absolute -left-40 -top-32 size-[42rem] rounded-full bg-aura-mesh-rose opacity-50 blur-3xl" />
      <div className="aura-blob-2 absolute -right-40 top-10 size-[36rem] rounded-full bg-aura-mesh-violet opacity-45 blur-3xl" />
      <div className="aura-blob-3 absolute -bottom-40 left-1/3 size-[40rem] rounded-full bg-aura-mesh-amber opacity-35 blur-3xl" />
    </div>
  );
}

"use client";

import "leaflet/dist/leaflet.css";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import { ImageIcon } from "lucide-react";
import type { AlbumSummary } from "@/types";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type MemoryMapProps = {
  albums: AlbumSummary[]; // only albums with coordinates
};

const PIN = 48;        // photo circle diameter
const PIN_ACTIVE = 60; // when selected
const TAIL = 9;        // pointer under the circle

/**
 * Apple-Memories-style pin: a round photo with a white ring and a
 * little tail, dropping in with a springy bounce. The active pin grows,
 * turns rose, and emits a soft pulse.
 */
function photoPin(album: AlbumSummary, active: boolean, order: number): L.DivIcon {
  const size = active ? PIN_ACTIVE : PIN;
  const inner = album.coverImage
    ? `<img src="${album.coverImage}" alt="" draggable="false" />`
    : `<span class="mm-pin__fallback">📍</span>`;

  const html = `
    <div class="mm-pin ${active ? "mm-pin--active" : ""}" style="--pin:${size}px;--delay:${Math.min(order * 90, 720)}ms">
      ${active ? '<span class="mm-pin__pulse"></span>' : ""}
      <span class="mm-pin__photo">${inner}</span>
      <span class="mm-pin__tail"></span>
    </div>`;

  return L.divIcon({
    className: "", // strip default leaflet styles
    html,
    iconSize: [size, size + TAIL],
    iconAnchor: [size / 2, size + TAIL], // anchor at the tail's tip
  });
}

/** Flies the map to the active album when a pin or card is tapped. */
function FlyTo({ album }: { album: AlbumSummary | null }) {
  const map = useMap();
  if (album && album.latitude !== null && album.longitude !== null) {
    map.flyTo([album.latitude, album.longitude], Math.max(map.getZoom(), 10), {
      duration: 0.7,
    });
  }
  return null;
}

export function MemoryMap({ albums }: MemoryMapProps) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = albums.find((a) => a.id === activeId) ?? null;

  const center = useMemo<[number, number]>(() => {
    const lat = albums.reduce((s, a) => s + (a.latitude ?? 0), 0) / albums.length;
    const lng = albums.reduce((s, a) => s + (a.longitude ?? 0), 0) / albums.length;
    return [lat, lng];
  }, [albums]);

  return (
    <div className="fixed inset-0 bottom-[72px]">
      {/* Pin styling + animations (scoped by mm- prefix) */}
      <style>{`
        .mm-pin{
          position:relative;
          width:var(--pin);
          display:flex;flex-direction:column;align-items:center;
          transform-origin:50% 100%;
          animation:mm-drop .55s cubic-bezier(.22,1.4,.36,1) both;
          animation-delay:var(--delay);
          cursor:pointer;
          filter:drop-shadow(0 3px 3px rgb(0 0 0/.25)) drop-shadow(0 10px 18px rgb(0 0 0/.18));
          transition:transform .2s ease;
        }
        .mm-pin:hover{ transform:scale(1.08); }
        .mm-pin__photo{
          width:var(--pin);height:var(--pin);
          border-radius:9999px;overflow:hidden;
          border:3px solid #fff;background:var(--blush);
          transition:border-color .2s ease;
        }
        .mm-pin__photo img{ width:100%;height:100%;object-fit:cover;display:block; }
        .mm-pin__fallback{ width:100%;height:100%;display:grid;place-items:center;font-size:18px; }
        .mm-pin__tail{
          width:0;height:0;margin-top:-1px;
          border-left:${TAIL - 2}px solid transparent;
          border-right:${TAIL - 2}px solid transparent;
          border-top:${TAIL}px solid #fff;
        }
        .mm-pin--active .mm-pin__photo{ border-color:var(--rose); }
        .mm-pin--active .mm-pin__tail{ border-top-color:var(--rose); }
        .mm-pin--active{ animation:mm-pop .35s cubic-bezier(.22,1.6,.36,1) both; }
        .mm-pin__pulse{
          position:absolute;top:0;left:50%;
          width:var(--pin);height:var(--pin);
          transform:translateX(-50%);
          border-radius:9999px;
          border:3px solid var(--rose);
          animation:mm-pulse 1.5s ease-out infinite;
          pointer-events:none;
        }
        @keyframes mm-drop{
          0%{ transform:translateY(-28px) scale(.4); opacity:0; }
          62%{ transform:translateY(4px) scale(1.06); opacity:1; }
          82%{ transform:translateY(-2px) scale(.98); }
          100%{ transform:translateY(0) scale(1); }
        }
        @keyframes mm-pop{
          0%{ transform:scale(.85); }
          60%{ transform:scale(1.08); }
          100%{ transform:scale(1); }
        }
        @keyframes mm-pulse{
          0%{ transform:translateX(-50%) scale(.95); opacity:.75; }
          100%{ transform:translateX(-50%) scale(1.9); opacity:0; }
        }
        @media (prefers-reduced-motion: reduce){
          .mm-pin, .mm-pin--active{ animation:none; }
          .mm-pin__pulse{ display:none; }
        }
        /* Leaflet chrome, matched to the design system */
        .leaflet-container{ font-family:var(--font-sans); }
        .leaflet-control-attribution{
          background:color-mix(in srgb, var(--paper) 80%, transparent)!important;
          color:var(--stone)!important; border-radius:8px 0 0 0;
        }
        .leaflet-control-attribution a{ color:var(--rose-deep)!important; }
      `}</style>

      <MapContainer
        center={center}
        zoom={albums.length === 1 ? 10 : 7}
        zoomControl={false}
        attributionControl
        className="size-full"
        style={{ background: "var(--sand)" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <FlyTo album={active} />
        {albums.map((album, i) => (
          <Marker
            key={`${album.id}-${activeId === album.id}`}
            position={[album.latitude!, album.longitude!]}
            icon={photoPin(album, activeId === album.id, i)}
            riseOnHover
            eventHandlers={{
              click: () =>
                activeId === album.id
                  ? router.push(`/albums/${album.id}`)
                  : setActiveId(album.id),
            }}
          />
        ))}
      </MapContainer>

      {/* Bottom sheet: visited places */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1000] pb-3">
        <p className="px-[var(--gutter)] pb-2 text-sm font-medium text-ink drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)] dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          Visited places · {albums.length}
        </p>
        <ul className="pointer-events-auto flex snap-x snap-mandatory gap-3 overflow-x-auto px-[var(--gutter)] pb-1">
          {albums.map((album) => (
            <li key={album.id} className="snap-start">
              <button
                type="button"
                onClick={() =>
                  activeId === album.id
                    ? router.push(`/albums/${album.id}`)
                    : setActiveId(album.id)
                }
                className={cn(
                  "flex w-60 items-center gap-3 rounded-xl bg-card p-3 text-left shadow-lifted transition-transform active:scale-[0.98]",
                  activeId === album.id && "ring-2 ring-rose",
                )}
              >
                <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-sand">
                  {album.coverImage ? (
                    <Image src={album.coverImage} alt="" fill sizes="56px" className="object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <ImageIcon className="size-5 text-stone/50" aria-hidden />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="display truncate text-[16px] text-ink">{album.title}</p>
                  <p className="truncate text-xs text-stone">
                    {album.location} · {formatDate(album.date)}
                  </p>
                  <p className="text-xs text-rose-deep">
                    {activeId === album.id ? "Tap again to open" : "Tap to locate"}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default MemoryMap;
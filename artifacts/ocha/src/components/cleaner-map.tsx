import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { useLocation } from "wouter";
import { Star, MapPin, Clock, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Fix leaflet default icon path broken by Vite ── */
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: "", shadowUrl: "" });

/* ── Custom marker factory ───────────────────────── */
function makeMarkerIcon(name: string, rating: number, isSelected: boolean) {
  const initial = name.charAt(0).toUpperCase();
  const bg = isSelected ? "#0d3d36" : "#1a6b5e";
  const shadow = isSelected ? "0 4px 16px rgba(13,61,54,0.55)" : "0 2px 8px rgba(0,0,0,0.25)";
  const size = isSelected ? 46 : 38;
  const html = `
    <div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${bg};color:white;
      display:flex;align-items:center;justify-content:center;
      font-size:${isSelected ? 16 : 14}px;font-weight:700;font-family:sans-serif;
      border:3px solid white;
      box-shadow:${shadow};
      transition:all .2s;
      position:relative;
    ">
      ${initial}
      <div style="
        position:absolute;bottom:-8px;left:50%;transform:translateX(-50%);
        background:#f59e0b;color:white;
        font-size:9px;font-weight:700;
        padding:1px 5px;border-radius:99px;
        border:1.5px solid white;
        white-space:nowrap;
      ">★ ${rating.toFixed(1)}</div>
    </div>
  `;
  return L.divIcon({
    html,
    className: "",
    iconSize: [size, size + 12],
    iconAnchor: [size / 2, size / 2],
  });
}

/* ── User location dot ───────────────────────────── */
function makeUserIcon() {
  return L.divIcon({
    html: `
      <div style="position:relative;width:18px;height:18px;">
        <div style="position:absolute;inset:0;border-radius:50%;background:rgba(26,107,94,0.2);animation:ping 1.4s ease-in-out infinite;"></div>
        <div style="position:absolute;inset:4px;border-radius:50%;background:#1a6b5e;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>
      </div>
    `,
    className: "",
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

/* ── Auto-fit bounds when cleaners change ─────────── */
function FitBounds({ cleaners }: { cleaners: any[] }) {
  const map = useMap();
  useEffect(() => {
    if (!cleaners.length) return;
    const points = cleaners
      .filter((c) => c.location?.lat && c.location?.lng)
      .map((c) => [c.location.lat, c.location.lng] as [number, number]);
    if (points.length > 1) {
      map.fitBounds(points, { padding: [48, 48], maxZoom: 14 });
    } else if (points.length === 1) {
      map.setView(points[0], 14);
    }
  }, [cleaners.length]);
  return null;
}

/* ── Bottom sheet for selected cleaner ───────────── */
function CleanerSheet({ cleaner, onClose }: { cleaner: any; onClose: () => void }) {
  const [, setLocation] = useLocation();
  const name = cleaner.fullName || cleaner.name || "Cleaner";
  const firstName = name.split(" ")[0];

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-[1000] bg-card rounded-t-3xl border-t border-border shadow-2xl px-4 pt-3 pb-6"
      style={{ animation: "slideUp .22s ease-out" }}
    >
      <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />
      <div className="flex items-start gap-3 mb-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full overflow-hidden bg-primary/20 shrink-0 flex items-center justify-center">
          {cleaner.avatarUrl ? (
            <img src={cleaner.avatarUrl} alt={name} className="w-12 h-12 object-cover" />
          ) : (
            <span className="text-lg font-bold text-primary">{name[0]}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">{name}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <div className="flex items-center gap-0.5">
              <Star size={11} className="text-amber-500 fill-amber-500" />
              <span className="text-xs font-semibold text-foreground">{cleaner.averageRating ?? "—"}</span>
              <span className="text-[10px] text-muted-foreground ml-0.5">({cleaner.reviewCount ?? 0})</span>
            </div>
            {cleaner.distanceKm != null && (
              <div className="flex items-center gap-0.5">
                <MapPin size={10} className="text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">{cleaner.distanceKm.toFixed(1)} km away</span>
              </div>
            )}
            {cleaner.eta && (
              <div className="flex items-center gap-0.5">
                <Clock size={10} className="text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">~{cleaner.eta}</span>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0"
        >
          <X size={13} className="text-muted-foreground" />
        </button>
      </div>

      {/* Service chips */}
      {cleaner.serviceTypes?.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-4">
          {(cleaner.serviceTypes as string[]).slice(0, 3).map((s: string) => (
            <span key={s} className="text-[10px] font-semibold px-2 py-0.5 bg-primary/10 text-primary rounded-full capitalize">
              {s.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      )}

      {/* Rate + trust score */}
      <div className="flex items-center gap-3 mb-4 bg-muted rounded-xl px-3 py-2.5">
        <div className="flex-1">
          <p className="text-[10px] text-muted-foreground">Hourly rate</p>
          <p className="text-sm font-bold text-foreground">£{cleaner.hourlyRate ?? "—"}/hr</p>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="flex-1">
          <p className="text-[10px] text-muted-foreground">Trust score</p>
          <p className="text-sm font-bold text-foreground">{cleaner.trustScore ?? "—"}/100</p>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="flex-1">
          <p className="text-[10px] text-muted-foreground">Response</p>
          <p className="text-sm font-bold text-foreground">{cleaner.responseTime ?? "< 1h"}</p>
        </div>
      </div>

      {/* CTAs */}
      <div className="flex gap-2">
        <button
          onClick={() => setLocation(`/cleaners/${cleaner.id}`)}
          className="flex-1 border border-primary/30 text-primary rounded-2xl py-3 text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-primary/5 transition-colors"
        >
          View profile
          <ChevronRight size={14} />
        </button>
        <button
          onClick={() => setLocation(`/book?cleanerId=${cleaner.id}`)}
          className="flex-1 bg-primary text-primary-foreground rounded-2xl py-3 text-sm font-bold flex items-center justify-center gap-1.5"
        >
          Book {firstName}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════ Map component ═══════════════════════ */
interface CleanerMapProps {
  cleaners: any[];
  className?: string;
  height?: number;
  selectedCleanerId?: string;
  onSelectCleaner?: (cleaner: any | null) => void;
}

const USER_LAT = 51.522;
const USER_LNG = -0.075;

export function CleanerMap({ cleaners, className, height = 320, selectedCleanerId, onSelectCleaner }: CleanerMapProps) {
  const [internalSelected, setInternalSelected] = useState<any>(null);
  const isControlled = onSelectCleaner !== undefined;
  const selectedId   = isControlled ? selectedCleanerId : internalSelected?.id;

  function handleSelect(cleaner: any) {
    if (isControlled) {
      onSelectCleaner(selectedCleanerId === cleaner.id ? null : cleaner);
    } else {
      setInternalSelected((prev: any) => prev?.id === cleaner.id ? null : cleaner);
    }
  }

  const selected = cleaners.find((c) => c.id === selectedId) ?? null;

  const withLocation = cleaners.filter(
    (c) => c.location?.lat && c.location?.lng && c.isAvailable
  );

  return (
    <div className={cn("relative rounded-2xl overflow-hidden border border-border", className)}>
      <style>{`
        @keyframes ping {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);   opacity: 1; }
        }
        .leaflet-container { background: #f0ede8; }
        .leaflet-control-zoom { display: none; }
        .leaflet-control-attribution { font-size: 8px; opacity: 0.6; }
      `}</style>

      <MapContainer
        center={[USER_LAT, USER_LNG]}
        zoom={13}
        style={{ height: `${height}px`, width: "100%" }}
        zoomControl={false}
        scrollWheelZoom={false}
        attributionControl={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com">CARTO</a>'
          subdomains="abcd"
          maxZoom={19}
        />
        <FitBounds cleaners={withLocation} />

        {/* User location dot */}
        <Marker
          position={[USER_LAT, USER_LNG]}
          icon={makeUserIcon()}
          zIndexOffset={100}
        />

        {/* Cleaner pins */}
        {withLocation.map((cleaner) => (
          <Marker
            key={cleaner.id}
            position={[cleaner.location.lat, cleaner.location.lng]}
            icon={makeMarkerIcon(
              cleaner.fullName || cleaner.name || "?",
              cleaner.averageRating ?? 0,
              selectedId === cleaner.id
            )}
            eventHandlers={{ click: () => handleSelect(cleaner) }}
            zIndexOffset={selectedId === cleaner.id ? 200 : 0}
          />
        ))}
      </MapContainer>

      {/* "You are here" badge */}
      <div className="absolute top-3 left-3 z-[999] bg-card/95 backdrop-blur-sm border border-border rounded-xl px-2.5 py-1.5 flex items-center gap-1.5 shadow-sm">
        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
        <span className="text-[10px] font-bold text-foreground">Your location</span>
      </div>

      {/* Cleaner count badge */}
      <div className="absolute top-3 right-3 z-[999] bg-primary text-primary-foreground rounded-xl px-2.5 py-1.5 shadow-sm">
        <span className="text-[10px] font-bold">{withLocation.length} nearby</span>
      </div>

      {/* Bottom sheet */}
      {selected && (
        <CleanerSheet
          cleaner={selected}
          onClose={() => isControlled ? onSelectCleaner!(null) : setInternalSelected(null)}
        />
      )}
    </div>
  );
}

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, MapPin, X, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/app.store';
import { geocodeCity } from '@/shared/lib/utils';

interface GeoResult {
  lat: number;
  lon: number;
  name: string;
  country: string;
}

export function LocationSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setActiveLocation = useAppStore((s) => s.setActiveLocation);
  const addSavedLocation = useAppStore((s) => s.addSavedLocation);
  const activeLocation = useAppStore((s) => s.activeLocation);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    setIsSearching(true);
    try {
      const data = await geocodeCity(q);
      setResults(data);
      setIsOpen(data.length > 0);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  const select = (r: GeoResult) => {
    setActiveLocation({ lat: r.lat, lon: r.lon, name: r.name });
    addSavedLocation({ lat: r.lat, lon: r.lon, name: r.name });
    setQuery('');
    setIsOpen(false);
  };

  const clear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full sm:w-auto">
      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus-within:border-aurora-cyan/40 transition-colors">
        {isSearching ? (
          <Loader2 size={15} className="text-slate-500 animate-spin shrink-0" />
        ) : (
          <Search size={15} className="text-slate-500 shrink-0" />
        )}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={activeLocation?.name ?? 'Search city…'}
          className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder-slate-500 font-body outline-none sm:w-56"
        />
        {query && (
          <button onClick={clear} className="text-slate-600 hover:text-slate-400 transition-colors">
            <X size={13} />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-2 left-0 z-50 w-full min-w-0 overflow-hidden rounded-xl border border-white/10 bg-night-900 shadow-2xl shadow-black/50 sm:w-72">
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => select(r)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
            >
              <MapPin size={14} className="text-aurora-cyan shrink-0" />
              <span className="text-sm text-white font-body truncate">{r.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

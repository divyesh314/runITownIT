'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { searchAddresses, type Place } from '@/app/actions/geocode';

type Props = {
  id: string;
  label: string;
  placeholder: string;
  onSelect: (place: Place) => void;
};

/**
 * A text input with a debounced, dropdown address search - the same shape
 * as the "search this location" box on any mapping app. Selecting a result
 * hands the full geocoded Place (not just text) up to the parent via
 * onSelect, which is what lets RunDistanceMap drop a pin the moment someone
 * picks an address, before they ever click Calculate.
 */
export function AddressAutocomplete({ id, label, placeholder, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close the dropdown on an outside click. A `mousedown` listener (not
  // `onBlur` on the input) is needed here: blur fires *before* a click on a
  // dropdown item registers, so onBlur alone would close the list right
  // before the click on it lands.
  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    setResults([]);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = value.trim();
    if (trimmed.length < 3) {
      setOpen(false);
      return;
    }

    // Debounced so we're not firing a Nominatim request on every keystroke
    // - only once typing pauses for a moment.
    debounceRef.current = setTimeout(() => {
      setOpen(true);
      startTransition(async () => {
        const hits = await searchAddresses(trimmed);
        setResults(hits);
      });
    }, 350);
  }

  function handleSelect(place: Place) {
    setQuery(place.label);
    setResults([]);
    setOpen(false);
    onSelect(place);
  }

  return (
    <div ref={containerRef} className="relative flex flex-1 flex-col gap-1.5">
      <label htmlFor={id} className="font-mono text-xs font-bold tracking-wide text-dim uppercase">
        {label}
      </label>
      <input
        id={id}
        type="text"
        autoComplete="off"
        value={query}
        placeholder={placeholder}
        onChange={(event) => handleChange(event.target.value)}
        onFocus={() => {
          if (results.length > 0) setOpen(true);
        }}
        className="rounded-lg border border-hairline bg-surface px-3 py-2.5 text-foreground outline-none transition-colors focus:border-ember"
      />
      {open && (
        <ul className="absolute top-full left-0 z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-hairline bg-surface shadow-lg">
          {isPending ? (
            <li className="px-3 py-2 text-sm text-dim">Searching…</li>
          ) : results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-dim">No matches</li>
          ) : (
            results.map((place, index) => (
              <li key={`${place.lat}-${place.lng}-${index}`}>
                <button
                  type="button"
                  onClick={() => handleSelect(place)}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-surface-2"
                >
                  {place.label}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';

// Module-level promise cache — all simultaneous mounts share one request
let _promise = null;
let _cache   = null;

export function useCompanyAssets() {
  const [assets, setAssets] = useState(_cache ?? {
    logoUrl: '', logoIconUrl: '', logoHeight: 36, logoIconSize: 32,
  });

  useEffect(() => {
    if (_cache) { setAssets(_cache); return; }
    if (!_promise) {
      _promise = fetch('/api/public/config')
        .then(r => r.json())
        .then(d => {
          _cache = {
            logoUrl:      d.companyLogo      ?? '',
            logoIconUrl:  d.companyLogoIcon  ?? '',
            logoHeight:   d.logoHeight        ?? 36,
            logoIconSize: d.logoIconSize      ?? 32,
          };
          return _cache;
        })
        .catch(() => {
          _cache = { logoUrl: '', logoIconUrl: '', logoHeight: 36, logoIconSize: 32 };
          return _cache;
        });
    }
    _promise.then(c => setAssets(c));
  }, []);

  return assets;
}

// Call this after uploading a new logo so the next mount fetches fresh data
export function invalidateCompanyAssets() {
  _promise = null;
  _cache   = null;
}

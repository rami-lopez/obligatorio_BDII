import React from 'react';
import { Box, Stack, Typography } from '@mui/material';

const TIPO_COLORES = {
  General:      { fill: '#378ADD', fillOpacity: 0.25, text: '#185FA5' },
  Preferencial: { fill: '#639922', fillOpacity: 0.25, text: '#3B6D11' },
  VIP:          { fill: '#BA7517', fillOpacity: 0.30, text: '#854F0B' },
  Agotado:      { fill: '#9E9E9E', fillOpacity: 0.20, text: '#757575' },
};

const SECTOR_NOMBRES = {
  norte: 'Tribuna Norte',
  sur: 'Tribuna Sur',
  este: 'Lateral Este',
  oeste: 'Lateral Oeste',
  vip_n: 'VIP Norte',
  vip_s: 'VIP Sur',
};

const SECTOR_PATHS = [
  { id: 'norte', d: 'M60,40 A155,125 0 0,1 260,40 L230,75 A100,80 0 0,0 90,75 Z', labelX: 160, labelY: 58 },
  { id: 'sur',   d: 'M60,220 A155,125 0 0,0 260,220 L230,185 A100,80 0 0,1 90,185 Z', labelX: 160, labelY: 215 },
  { id: 'este',  d: 'M265,40 A155,125 0 0,1 265,220 L230,185 A100,80 0 0,0 230,75 Z', labelX: 256, labelY: 130, rotate: 90 },
  { id: 'oeste', d: 'M55,40 A155,125 0 0,0 55,220 L90,185 A100,80 0 0,1 90,75 Z', labelX: 64, labelY: 130, rotate: -90 },
  { id: 'vip_n', d: 'M110,75 A100,80 0 0,1 210,75 L200,95 A75,60 0 0,0 120,95 Z', labelX: 160, labelY: 89 },
  { id: 'vip_s', d: 'M110,185 A100,80 0 0,0 210,185 L200,165 A75,60 0 0,1 120,165 Z', labelX: 160, labelY: 179 },
];

export { TIPO_COLORES, SECTOR_NOMBRES, SECTOR_PATHS };

export default function EstadioSVGBase({
  sectores,
  selectedSectorId,
  onSectorClick,
  agotadoPredicate = (s) => s.disponibles === 0,
  sectorStyle,
  sectorLabel,
  pathSectorResolver,
}) {
  const sectorMap = Object.fromEntries(sectores.map(s => [s.codigo, s]));

  return (
    <Box sx={{ width: '100%', maxWidth: 380, mx: 'auto' }}>
      <svg viewBox="0 0 320 260" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', display: 'block' }}>
        <ellipse cx="160" cy="130" rx="155" ry="125"
          fill="var(--color-bg, #F5F5F5)"
          stroke="#E0E0E0" strokeWidth="0.5" />

        <ellipse cx="160" cy="130" rx="85" ry="65" fill="#3B6D11" opacity="0.15" />
        <ellipse cx="160" cy="130" rx="75" ry="55" fill="none" stroke="#3B6D11" strokeWidth="1" opacity="0.35" />
        <rect x="130" y="108" width="60" height="44" rx="2" fill="none" stroke="#3B6D11" strokeWidth="1" opacity="0.25" />
        <line x1="160" y1="108" x2="160" y2="152" stroke="#3B6D11" strokeWidth="0.5" opacity="0.35" />
        <text x="160" y="134" textAnchor="middle" fontSize="8" fill="#3B6D11" opacity="0.5"
          fontFamily="Inter, sans-serif">cancha</text>

        {SECTOR_PATHS.map((sp, index) => {
          const sector = pathSectorResolver
            ? pathSectorResolver(index, sp.id)
            : sectorMap[sp.id];
          if (!sector) return null;
          const agotado = agotadoPredicate(sector);
          const colores = agotado ? TIPO_COLORES.Agotado : TIPO_COLORES.General;
          const isSelected = selectedSectorId === sp.id;
          const customStyle = sectorStyle ? sectorStyle(sector, agotado, index) : {};

          return (
            <g key={sp.id}>
              <path
                d={sp.d}
                fill={customStyle.fill ?? colores.fill}
                fillOpacity={customStyle.fillOpacity ?? colores.fillOpacity}
                stroke={customStyle.stroke ?? (isSelected ? '#042C53' : '#BDBDBD')}
                strokeWidth={customStyle.strokeWidth ?? (isSelected ? 2 : 0.5)}
                strokeDasharray={customStyle.strokeDasharray}
                style={{ cursor: agotado ? 'not-allowed' : 'pointer', transition: 'all 0.15s', ...(customStyle.style || {}) }}
                onClick={() => { if (!agotado && customStyle.clickable !== false) onSectorClick?.(sector); }}
                onMouseEnter={e => { if (!agotado) e.target.style.fillOpacity = (customStyle.fillOpacity ?? colores.fillOpacity) + 0.2; }}
                onMouseLeave={e => { e.target.style.fillOpacity = customStyle.fillOpacity ?? colores.fillOpacity; }}
              />
              <text
                x={sp.labelX}
                y={sp.labelY}
                textAnchor="middle"
                fontSize={customStyle.fontSize ?? 9}
                fill={customStyle.textFill ?? colores.text}
                fontFamily="Inter, sans-serif"
                style={{ pointerEvents: 'none', userSelect: 'none', ...(customStyle.textStyle || {}) }}
                transform={sp.rotate ? `rotate(${sp.rotate},${sp.labelX},${sp.labelY})` : undefined}
              >
                {sectorLabel ? sectorLabel(sector, agotado, sp, index) : (
                  agotado
                    ? `${(SECTOR_NOMBRES[sp.id] || sp.id).split(' ')[1] || SECTOR_NOMBRES[sp.id] || sp.id} · Agotado`
                    : `${(SECTOR_NOMBRES[sp.id] || sp.id).split(' ')[1] || SECTOR_NOMBRES[sp.id] || sp.id} · USD ${sector.costo ?? sector.precio}`
                )}
              </text>
            </g>
          );
        })}
      </svg>

      <Stack direction="row" gap={2} flexWrap="wrap" justifyContent="center" mt={1.5}>
        {[
          { label: 'Disponible', color: '#378ADD' },
          { label: 'Agotado',    color: '#9E9E9E' },
        ].map(item => (
          <Stack key={item.label} direction="row" alignItems="center" gap={0.75}>
            <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: item.color, opacity: 0.7 }} />
            <Typography fontSize={12} color="text.secondary">{item.label}</Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

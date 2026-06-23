import React from 'react';
import EstadioSVGBase from '../shared/EstadioSVGBase';

export default function EstadioSVGAdmin({ sectores, onToggle }) {
  const sectorStyle = (sector, _agotado, index) => {
    const habilitado = sector.habilitado === true;
    const bloqueada = sector.tieneEntradas && habilitado;
    return {
      fill: bloqueada ? '#BA7517' : habilitado ? '#639922' : '#9E9E9E',
      fillOpacity: bloqueada ? 0.25 : habilitado ? 0.3 : 0.12,
      stroke: bloqueada ? '#854F0B' : habilitado ? '#3B6D11' : '#BDBDBD',
      strokeWidth: 1.5,
      strokeDasharray: bloqueada ? '2 2' : habilitado ? undefined : '4 2',
      style: { cursor: bloqueada ? 'not-allowed' : 'pointer' },
      clickable: !bloqueada,
      fontSize: 10,
      textFill: bloqueada ? '#854F0B' : habilitado ? '#3B6D11' : '#757575',
      textStyle: { fontWeight: 500 },
    };
  };

  const sectorLabel = (sector) => {
    const habilitado = sector.habilitado === true;
    const icono = sector.tieneEntradas && habilitado ? '🔒' : habilitado ? '✓' : '✗';
    return `${sector.codigo} ${icono}`;
  };

  const handleClick = (sector) => {
    if (sector.tieneEntradas && sector.habilitado) return;
    onToggle(sector.codigo);
  };

  return (
    <EstadioSVGBase
      sectores={sectores}
      onSectorClick={handleClick}
      agotadoPredicate={() => false}
      sectorStyle={sectorStyle}
      sectorLabel={sectorLabel}
      pathSectorResolver={(index) => sectores[index] || null}
    />
  );
}

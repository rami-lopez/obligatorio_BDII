import React from 'react';
import { Outlet } from 'react-router-dom';

function FuncionarioLayout() {
  return (
    <div>
      FuncionarioLayout
      <Outlet />
    </div>
  );
}

export default FuncionarioLayout;
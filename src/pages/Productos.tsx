import React from 'react';

const Productos = () => {
  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b">
        <h1 className="text-3xl font-bold mb-2">Gestión de Productos</h1>
        <p className="text-muted-foreground">
          Aquí podrás cargar, eliminar y modificar productos del catálogo.
        </p>
      </div>
      <div className="flex-1 overflow-auto p-6">
        {/* Future implementation for product management */}
      </div>
    </div>
  );
};

export default Productos;

import React from 'react';

const Clientes = () => {
  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b">
        <h1 className="text-3xl font-bold mb-2">Gestión de Clientes</h1>
        <p className="text-muted-foreground">
          Aquí podrás gestionar los clientes del sistema.
        </p>
      </div>
      <div className="flex-1 overflow-auto p-6">
        {/* Future implementation for client management */}
      </div>
    </div>
  );
};

export default Clientes;

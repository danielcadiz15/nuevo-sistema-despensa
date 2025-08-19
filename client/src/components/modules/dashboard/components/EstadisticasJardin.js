import React from 'react';

const EstadisticasJardin = ({ tareas, calcularDiasRestantes }) => {
  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="text-center bg-white rounded-lg p-3 border border-green-200">
        <div className="text-2xl font-bold text-green-600">
          {tareas.filter(t => !t.completada).length}
        </div>
        <div className="text-sm text-green-700">Pendientes</div>
      </div>
      <div className="text-center bg-white rounded-lg p-3 border border-green-200">
        <div className="text-2xl font-bold text-blue-600">
          {tareas.filter(t => t.completada).length}
        </div>
        <div className="text-sm text-blue-700">Completadas</div>
      </div>
      <div className="text-center bg-white rounded-lg p-3 border border-green-200">
        <div className="text-2xl font-bold text-orange-600">
          {tareas.filter(t => {
            const dias = calcularDiasRestantes(t.fechaLimite);
            return dias !== null && dias <= 1;
          }).length}
        </div>
        <div className="text-sm text-orange-700">Urgentes</div>
      </div>
    </div>
  );
};

export default EstadisticasJardin; 
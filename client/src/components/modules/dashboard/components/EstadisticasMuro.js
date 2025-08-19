import React from 'react';

const EstadisticasMuro = ({ ideas }) => {
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <div className="text-center bg-white rounded-lg p-3 border border-purple-200">
        <div className="text-2xl font-bold text-purple-600">
          {ideas.length}
        </div>
        <div className="text-sm text-purple-700">Total Ideas</div>
      </div>
      <div className="text-center bg-white rounded-lg p-3 border border-purple-200">
        <div className="text-2xl font-bold text-green-600">
          {ideas.filter(i => i.estado === 'implementada').length}
        </div>
        <div className="text-sm text-green-700">Implementadas</div>
      </div>
      <div className="text-center bg-white rounded-lg p-3 border border-purple-200">
        <div className="text-2xl font-bold text-blue-600">
          {ideas.filter(i => i.estado === 'en_proceso').length}
        </div>
        <div className="text-sm text-blue-700">En Proceso</div>
      </div>
      <div className="text-center bg-white rounded-lg p-3 border border-purple-200">
        <div className="text-2xl font-bold text-yellow-600">
          {ideas.reduce((total, idea) => total + idea.likes, 0)}
        </div>
        <div className="text-sm text-yellow-700">Total Likes</div>
      </div>
    </div>
  );
};

export default EstadisticasMuro; 
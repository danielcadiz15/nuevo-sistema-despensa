import React from 'react';
import { FaTrash, FaEdit, FaHeart, FaComment } from 'react-icons/fa';
import Button from '../../../common/Button';
import {
  obtenerColorImpacto,
  obtenerColorEstado,
  obtenerIconoCategoria
} from '../utils/muroUtils';

const TarjetaIdea = ({ 
  idea, 
  abrirEditar, 
  eliminarIdea, 
  darLike, 
  votarIdea, 
  cambiarEstado 
}) => {
  return (
    <div
      className={`relative p-4 rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
        obtenerColorEstado(idea.estado)
      }`}
    >
      {/* Categoría */}
      <div className="absolute top-2 left-2 text-2xl">
        {obtenerIconoCategoria(idea.categoria)}
      </div>

      {/* Impacto */}
      <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium border ${
        obtenerColorImpacto(idea.impacto)
      }`}>
        {idea.impacto.toUpperCase()}
      </div>

      {/* Contenido de la idea */}
      <div className="mt-8">
        <h4 className="font-bold text-lg mb-2 text-gray-800">
          {idea.titulo}
        </h4>
        
        {idea.descripcion && (
          <p className="text-sm text-gray-600 mb-3">
            {idea.descripcion}
          </p>
        )}

        {/* Estado */}
        <div className="text-xs font-medium mb-3 text-gray-500">
          Estado: {idea.estado.replace('_', ' ')}
        </div>

        {/* Métricas */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <span>👤 {idea.autor}</span>
          <span>📅 {new Date(idea.fechaCreacion).toLocaleDateString('es-AR')}</span>
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => darLike(idea.id)}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-500 transition-colors"
            >
              <FaHeart className={idea.likes > 0 ? 'text-red-500' : ''} />
              {idea.likes}
            </button>
            
            <span className="flex items-center gap-1 text-sm text-gray-600">
              <FaComment />
              {idea.comentarios.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => votarIdea(idea.id, 1)}
              className="text-sm text-gray-600 hover:text-green-500 transition-colors"
            >
              ⬆️
            </button>
            <span className="text-sm font-medium text-gray-700 mx-1">
              {idea.votos}
            </span>
            <button
              onClick={() => votarIdea(idea.id, -1)}
              className="text-sm text-gray-600 hover:text-red-500 transition-colors"
            >
              ⬇️
            </button>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-center gap-2">
          <Button
            size="sm"
            color="blue"
            icon={<FaEdit />}
            onClick={() => abrirEditar(idea)}
          >
            Editar
          </Button>
          
          <Button
            size="sm"
            color="red"
            icon={<FaTrash />}
            onClick={() => eliminarIdea(idea.id)}
          >
            Eliminar
          </Button>
        </div>

        {/* Selector de estado */}
        <div className="mt-3">
          <select
            value={idea.estado}
            onChange={(e) => cambiarEstado(idea.id, e.target.value)}
            className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            <option value="nueva">Nueva</option>
            <option value="evaluando">Evaluando</option>
            <option value="en_proceso">En Proceso</option>
            <option value="implementada">Implementada</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default TarjetaIdea; 
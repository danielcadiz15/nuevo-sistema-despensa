import React from 'react';
import { FaSeedling, FaLeaf, FaTree, FaTrash, FaCheck, FaEdit } from 'react-icons/fa';
import Button from '../../../common/Button';
import {
  obtenerEstadoPlanta,
  obtenerColorPrioridad,
  obtenerBgPrioridad,
  calcularDiasRestantes,
  obtenerTextoDias,
  obtenerColorDias
} from '../utils/jardinUtils';

const TarjetaTarea = ({ tarea, toggleCompletada, abrirEditar, eliminarTarea }) => {
  const estadoPlanta = obtenerEstadoPlanta(tarea);
  const diasRestantes = calcularDiasRestantes(tarea.fechaLimite);
  const IconoPlanta = estadoPlanta === 'tree' ? FaTree : 
                       estadoPlanta === 'leaf' ? FaLeaf : FaSeedling;

  return (
    <div
      className={`relative p-4 rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
        tarea.completada 
          ? 'bg-green-100 border-green-300' 
          : obtenerBgPrioridad(tarea.prioridad)
      }`}
    >
      {/* Indicador de prioridad */}
      <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${
        tarea.prioridad === 'alta' ? 'bg-red-500' :
        tarea.prioridad === 'media' ? 'bg-yellow-500' : 'bg-green-500'
      }`} />

      {/* Planta */}
      <div className="text-center mb-3">
        <IconoPlanta 
          className={`text-4xl ${
            tarea.completada ? 'text-green-600' : obtenerColorPrioridad(tarea.prioridad)
          }`} 
        />
      </div>

      {/* Contenido de la tarea */}
      <div className="text-center">
        <h4 className={`font-bold mb-2 ${
          tarea.completada ? 'line-through text-green-700' : 'text-gray-800'
        }`}>
          {tarea.titulo}
        </h4>
        
        {tarea.descripcion && (
          <p className={`text-sm mb-2 ${
            tarea.completada ? 'text-green-600' : 'text-gray-600'
          }`}>
            {tarea.descripcion}
          </p>
        )}

        {/* Fecha límite */}
        {tarea.fechaLimite && (
          <div className={`text-xs font-medium mb-3 ${
            obtenerColorDias(diasRestantes)
          }`}>
            {obtenerTextoDias(diasRestantes)}
          </div>
        )}

        {/* Categoría */}
        <div className="text-xs text-gray-500 mb-3">
          {tarea.categoria}
        </div>

        {/* Botones de acción */}
        <div className="flex justify-center gap-2">
          <Button
            size="sm"
            color={tarea.completada ? "gray" : "green"}
            icon={<FaCheck />}
            onClick={() => toggleCompletada(tarea.id)}
          >
            {tarea.completada ? 'Completada' : 'Completar'}
          </Button>
          
          <Button
            size="sm"
            color="blue"
            icon={<FaEdit />}
            onClick={() => abrirEditar(tarea)}
          >
            Editar
          </Button>
          
          <Button
            size="sm"
            color="red"
            icon={<FaTrash />}
            onClick={() => eliminarTarea(tarea.id)}
          >
            Eliminar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TarjetaTarea; 
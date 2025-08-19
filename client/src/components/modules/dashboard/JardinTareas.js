import React from 'react';
import { FaSeedling, FaPlus } from 'react-icons/fa';
import Button from '../../common/Button';
import { useJardinTareas } from './hooks/useJardinTareas';
import { calcularDiasRestantes } from './utils/jardinUtils';
import EstadisticasJardin from './components/EstadisticasJardin';
import TarjetaTarea from './components/TarjetaTarea';
import ModalTarea from './components/ModalTarea';

/**
 * 🌱 Jardín de Tareas - Visualización de tareas como plantas en crecimiento
 */
const JardinTareas = () => {
  const {
    tareas,
    modalAbierto,
    editandoTarea,
    nuevaTarea,
    setModalAbierto,
    setEditandoTarea,
    setNuevaTarea,
    agregarTarea,
    editarTarea,
    toggleCompletada,
    eliminarTarea,
    abrirEditar
  } = useJardinTareas();

  return (
    <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-green-800 flex items-center">
            🌱 Jardín de Tareas
          </h3>
          <p className="text-green-600 text-sm">
            Cultiva tus tareas y hazlas crecer
          </p>
        </div>
        <Button
          color="green"
          size="sm"
          icon={<FaPlus />}
          onClick={() => setModalAbierto(true)}
        >
          Nueva Tarea
        </Button>
      </div>

      {/* Estadísticas */}
      <EstadisticasJardin 
        tareas={tareas} 
        calcularDiasRestantes={calcularDiasRestantes} 
      />

      {/* Jardín de tareas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tareas.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <FaSeedling className="mx-auto text-6xl text-green-300 mb-4" />
            <h4 className="text-lg font-medium text-green-700 mb-2">
              Tu jardín está vacío
            </h4>
            <p className="text-green-600">
              Agrega tu primera tarea para comenzar a cultivar
            </p>
          </div>
        ) : (
          tareas.map(tarea => (
            <TarjetaTarea
              key={tarea.id}
              tarea={tarea}
              toggleCompletada={toggleCompletada}
              abrirEditar={abrirEditar}
              eliminarTarea={eliminarTarea}
            />
          ))
        )}
      </div>

      {/* Modal para agregar/editar tarea */}
      <ModalTarea
        modalAbierto={modalAbierto}
        editandoTarea={editandoTarea}
        nuevaTarea={nuevaTarea}
        setModalAbierto={setModalAbierto}
        setEditandoTarea={setEditandoTarea}
        setNuevaTarea={setNuevaTarea}
        agregarTarea={agregarTarea}
        editarTarea={editarTarea}
      />
    </div>
  );
};

export default JardinTareas;

import React from 'react';
import { FaLightbulb, FaPlus } from 'react-icons/fa';
import Button from '../../common/Button';
import { useMuroInnovacion } from './hooks/useMuroInnovacion';
import EstadisticasMuro from './components/EstadisticasMuro';
import TarjetaIdea from './components/TarjetaIdea';
import ModalIdea from './components/ModalIdea';

/**
 * 🚀 Muro de Innovación - Espacio para ideas y propuestas creativas
 */
const MuroInnovacion = () => {
  const {
    ideas,
    modalAbierto,
    editandoIdea,
    nuevaIdea,
    setModalAbierto,
    setEditandoIdea,
    setNuevaIdea,
    agregarIdea,
    editarIdea,
    eliminarIdea,
    abrirEditar,
    abrirNuevo,
    darLike,
    votarIdea,
    cambiarEstado
  } = useMuroInnovacion();

  // Funciones adaptadoras para el modal
  const handleSaveIdea = (ideaData) => {
    if (editandoIdea) {
      // Actualizar la idea existente con los nuevos datos
      setEditandoIdea(ideaData);
      editarIdea();
    } else {
      // Crear nueva idea con los datos del formulario
      setNuevaIdea({
        titulo: ideaData.titulo || '',
        descripcion: ideaData.descripcion || '',
        categoria: ideaData.categoria || 'general',
        impacto: ideaData.impacto || 'medio',
        estado: 'nueva'
      });
      agregarIdea();
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-purple-800 flex items-center">
            🚀 Muro de Innovación
          </h3>
          <p className="text-purple-600 text-sm">
            Comparte y desarrolla ideas brillantes
          </p>
        </div>
        <Button
          color="purple"
          size="sm"
          icon={<FaPlus />}
          onClick={abrirNuevo}
        >
          Nueva Idea
        </Button>
      </div>

      {/* Estadísticas del muro */}
      <EstadisticasMuro ideas={ideas} />

      {/* Muro de ideas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ideas.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <FaLightbulb className="mx-auto text-6xl text-purple-300 mb-4" />
            <h4 className="text-lg font-medium text-purple-700 mb-2">
              El muro está vacío
            </h4>
            <p className="text-purple-600">
              Sé el primero en compartir una idea brillante
            </p>
          </div>
        ) : (
          ideas.map(idea => (
            <TarjetaIdea
              key={idea.id}
              idea={idea}
              abrirEditar={abrirEditar}
              eliminarIdea={eliminarIdea}
              darLike={darLike}
              votarIdea={votarIdea}
              cambiarEstado={cambiarEstado}
            />
          ))
        )}
      </div>

      {/* Modal para agregar/editar idea */}
      <ModalIdea
        isOpen={modalAbierto}
        initialData={editandoIdea}
        onClose={() => {
          setModalAbierto(false);
          setEditandoIdea(null);
        }}
        onSave={handleSaveIdea}
      />
    </div>
  );
};

export default MuroInnovacion; 
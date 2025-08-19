import React, { useState, useEffect } from 'react';
import { FaLightbulb, FaRocket, FaStar, FaTrash, FaPlus, FaEdit, FaHeart, FaComment } from 'react-icons/fa';
import Button from '../../common/Button';
import Modal from '../../common/Modal';

/**
 * 🚀 Muro de Innovación - Espacio para ideas y propuestas creativas
 */
const MuroInnovacion = () => {
  const [ideas, setIdeas] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoIdea, setEditandoIdea] = useState(null);
  const [nuevaIdea, setNuevaIdea] = useState({
    titulo: '',
    descripcion: '',
    categoria: 'general',
    impacto: 'medio',
    estado: 'nueva'
  });

  // Cargar ideas desde localStorage al iniciar
  useEffect(() => {
    const ideasGuardadas = localStorage.getItem('muroInnovacion');
    if (ideasGuardadas) {
      setIdeas(JSON.parse(ideasGuardadas));
    }
  }, []);

  // Guardar ideas en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem('muroInnovacion', JSON.stringify(ideas));
  }, [ideas]);

  // Obtener color según impacto
  const obtenerColorImpacto = (impacto) => {
    switch (impacto) {
      case 'alto': return 'text-red-600 bg-red-50 border-red-200';
      case 'medio': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'bajo': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  // Obtener color según estado
  const obtenerColorEstado = (estado) => {
    switch (estado) {
      case 'implementada': return 'text-green-600 bg-green-100 border-green-300';
      case 'en_proceso': return 'text-blue-600 bg-blue-100 border-blue-300';
      case 'evaluando': return 'text-purple-600 bg-purple-100 border-purple-300';
      case 'nueva': return 'text-gray-600 bg-gray-100 border-gray-300';
      default: return 'text-gray-600 bg-gray-100 border-gray-300';
    }
  };

  // Obtener icono según categoría
  const obtenerIconoCategoria = (categoria) => {
    switch (categoria) {
      case 'producto': return '📦';
      case 'proceso': return '⚙️';
      case 'tecnologia': return '💻';
      case 'marketing': return '📢';
      case 'servicio': return '🛠️';
      case 'organizacional': return '🏢';
      default: return '💡';
    }
  };

  // Agregar nueva idea
  const agregarIdea = () => {
    if (!nuevaIdea.titulo.trim()) return;

    const idea = {
      id: Date.now(),
      ...nuevaIdea,
      fechaCreacion: new Date().toISOString(),
      likes: 0,
      comentarios: [],
      autor: 'Usuario Actual',
      votos: 0
    };

    setIdeas([...ideas, idea]);
    setNuevaIdea({
      titulo: '',
      descripcion: '',
      categoria: 'general',
      impacto: 'medio',
      estado: 'nueva'
    });
    setModalAbierto(false);
  };

  // Editar idea
  const editarIdea = () => {
    if (!editandoIdea.titulo.trim()) return;

    setIdeas(ideas.map(i => 
      i.id === editandoIdea.id ? editandoIdea : i
    ));
    setEditandoIdea(null);
    setModalAbierto(false);
  };

  // Eliminar idea
  const eliminarIdea = (id) => {
    setIdeas(ideas.filter(i => i.id !== id));
  };

  // Abrir modal para editar
  const abrirEditar = (idea) => {
    setEditandoIdea({ ...idea });
    setModalAbierto(true);
  };

  // Dar like a una idea
  const darLike = (id) => {
    setIdeas(ideas.map(i => 
      i.id === id ? { ...i, likes: i.likes + 1 } : i
    ));
  };

  // Votar por una idea
  const votarIdea = (id, voto) => {
    setIdeas(ideas.map(i => 
      i.id === id ? { ...i, votos: i.votos + voto } : i
    ));
  };

  // Cambiar estado de una idea
  const cambiarEstado = (id, nuevoEstado) => {
    setIdeas(ideas.map(i => 
      i.id === id ? { ...i, estado: nuevoEstado } : i
    ));
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
          onClick={() => setModalAbierto(true)}
        >
          Nueva Idea
        </Button>
      </div>

      {/* Estadísticas del muro */}
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
            <div
              key={idea.id}
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
          ))
        )}
      </div>

      {/* Modal para agregar/editar idea */}
      <Modal
        open={modalAbierto}
        onClose={() => {
          setModalAbierto(false);
          setEditandoIdea(null);
        }}
        title={editandoIdea ? "Editar Idea" : "Nueva Idea"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título *
            </label>
            <input
              type="text"
              value={editandoIdea?.titulo || nuevaIdea.titulo}
              onChange={(e) => {
                if (editandoIdea) {
                  setEditandoIdea({ ...editandoIdea, titulo: e.target.value });
                } else {
                  setNuevaIdea({ ...nuevaIdea, titulo: e.target.value });
                }
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Describe tu idea en pocas palabras"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={editandoIdea?.descripcion || nuevaIdea.descripcion}
              onChange={(e) => {
                if (editandoIdea) {
                  setEditandoIdea({ ...editandoIdea, descripcion: e.target.value });
                } else {
                  setNuevaIdea({ ...nuevaIdea, descripcion: e.target.value });
                }
              }}
              rows={4}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Explica tu idea en detalle..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría
              </label>
              <select
                value={editandoIdea?.categoria || nuevaIdea.categoria}
                onChange={(e) => {
                  if (editandoIdea) {
                    setEditandoIdea({ ...editandoIdea, categoria: e.target.value });
                  } else {
                    setNuevaIdea({ ...nuevaIdea, categoria: e.target.value });
                  }
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="general">General</option>
                <option value="producto">Producto</option>
                <option value="proceso">Proceso</option>
                <option value="tecnologia">Tecnología</option>
                <option value="marketing">Marketing</option>
                <option value="servicio">Servicio</option>
                <option value="organizacional">Organizacional</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Impacto Esperado
              </label>
              <select
                value={editandoIdea?.impacto || nuevaIdea.impacto}
                onChange={(e) => {
                  if (editandoIdea) {
                    setEditandoIdea({ ...editandoIdea, impacto: e.target.value });
                  } else {
                    setNuevaIdea({ ...nuevaIdea, impacto: e.target.value });
                  }
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="bajo">Bajo</option>
                <option value="medio">Medio</option>
                <option value="alto">Alto</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button
            color="gray"
            onClick={() => {
              setModalAbierto(false);
              setEditandoIdea(null);
            }}
          >
            Cancelar
          </Button>
          <Button
            color="purple"
            onClick={editandoIdea ? editarIdea : agregarIdea}
          >
            {editandoIdea ? 'Guardar Cambios' : 'Compartir Idea'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default MuroInnovacion; 
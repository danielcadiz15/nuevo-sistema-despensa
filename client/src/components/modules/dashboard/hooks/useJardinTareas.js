import { useState, useEffect } from 'react';

export const useJardinTareas = () => {
  const [tareas, setTareas] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoTarea, setEditandoTarea] = useState(null);
  const [nuevaTarea, setNuevaTarea] = useState({
    titulo: '',
    descripcion: '',
    prioridad: 'media',
    fechaLimite: '',
    categoria: 'general'
  });

  // Cargar tareas desde localStorage
  useEffect(() => {
    const tareasGuardadas = localStorage.getItem('jardinTareas');
    if (tareasGuardadas) {
      setTareas(JSON.parse(tareasGuardadas));
    }
  }, []);

  // Guardar tareas en localStorage
  useEffect(() => {
    localStorage.setItem('jardinTareas', JSON.stringify(tareas));
  }, [tareas]);

  // Funciones de gestión
  const agregarTarea = () => {
    if (!nuevaTarea.titulo.trim()) return;

    const tarea = {
      id: Date.now(),
      ...nuevaTarea,
      fechaCreacion: new Date().toISOString(),
      completada: false,
      fechaCompletado: null
    };

    setTareas([...tareas, tarea]);
    setNuevaTarea({
      titulo: '',
      descripcion: '',
      prioridad: 'media',
      fechaLimite: '',
      categoria: 'general'
    });
    setModalAbierto(false);
  };

  const editarTarea = () => {
    if (!editandoTarea.titulo.trim()) return;

    setTareas(tareas.map(t => 
      t.id === editandoTarea.id ? editandoTarea : t
    ));
    setEditandoTarea(null);
    setModalAbierto(false);
  };

  const toggleCompletada = (id) => {
    setTareas(tareas.map(t => {
      if (t.id === id) {
        return {
          ...t,
          completada: !t.completada,
          fechaCompletado: !t.completada ? new Date().toISOString() : null
        };
      }
      return t;
    }));
  };

  const eliminarTarea = (id) => {
    setTareas(tareas.filter(t => t.id !== id));
  };

  const abrirEditar = (tarea) => {
    setEditandoTarea({ ...tarea });
    setModalAbierto(true);
  };

  const resetearNuevaTarea = () => {
    setNuevaTarea({
      titulo: '',
      descripcion: '',
      prioridad: 'media',
      fechaLimite: '',
      categoria: 'general'
    });
  };

  return {
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
    abrirEditar,
    resetearNuevaTarea
  };
}; 
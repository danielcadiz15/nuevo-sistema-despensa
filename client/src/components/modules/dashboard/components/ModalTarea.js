import React from 'react';
import Button from '../../../common/Button';
import Modal from '../../../common/Modal';

const ModalTarea = ({
  modalAbierto,
  editandoTarea,
  nuevaTarea,
  setModalAbierto,
  setEditandoTarea,
  setNuevaTarea,
  agregarTarea,
  editarTarea
}) => {
  return (
    <Modal
      open={modalAbierto}
      onClose={() => {
        setModalAbierto(false);
        setEditandoTarea(null);
      }}
      title={editandoTarea ? "Editar Tarea" : "Nueva Tarea"}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Título *
          </label>
          <input
            type="text"
            value={editandoTarea?.titulo || nuevaTarea.titulo}
            onChange={(e) => {
              if (editandoTarea) {
                setEditandoTarea({ ...editandoTarea, titulo: e.target.value });
              } else {
                setNuevaTarea({ ...nuevaTarea, titulo: e.target.value });
              }
            }}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="¿Qué necesitas hacer?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            value={editandoTarea?.descripcion || nuevaTarea.descripcion}
            onChange={(e) => {
              if (editandoTarea) {
                setEditandoTarea({ ...editandoTarea, descripcion: e.target.value });
              } else {
                setNuevaTarea({ ...nuevaTarea, descripcion: e.target.value });
              }
            }}
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Detalles adicionales..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prioridad
            </label>
            <select
              value={editandoTarea?.prioridad || nuevaTarea.prioridad}
              onChange={(e) => {
                if (editandoTarea) {
                  setEditandoTarea({ ...editandoTarea, prioridad: e.target.value });
                } else {
                  setNuevaTarea({ ...nuevaTarea, prioridad: e.target.value });
                }
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría
            </label>
            <select
              value={editandoTarea?.categoria || nuevaTarea.categoria}
              onChange={(e) => {
                if (editandoTarea) {
                  setEditandoTarea({ ...editandoTarea, categoria: e.target.value });
                } else {
                  setNuevaTarea({ ...nuevaTarea, categoria: e.target.value });
                }
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="general">General</option>
              <option value="trabajo">Trabajo</option>
              <option value="personal">Personal</option>
              <option value="urgente">Urgente</option>
              <option value="proyecto">Proyecto</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha Límite
          </label>
          <input
            type="datetime-local"
            value={editandoTarea?.fechaLimite || nuevaTarea.fechaLimite}
            onChange={(e) => {
              if (editandoTarea) {
                setEditandoTarea({ ...editandoTarea, fechaLimite: e.target.value });
              } else {
                setNuevaTarea({ ...nuevaTarea, fechaLimite: e.target.value });
              }
            }}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <Button
          color="gray"
          onClick={() => {
            setModalAbierto(false);
            setEditandoTarea(null);
          }}
        >
          Cancelar
        </Button>
        <Button
          color="green"
          onClick={editandoTarea ? editarTarea : agregarTarea}
        >
          {editandoTarea ? 'Guardar Cambios' : 'Agregar Tarea'}
        </Button>
      </div>
    </Modal>
  );
};

export default ModalTarea; 
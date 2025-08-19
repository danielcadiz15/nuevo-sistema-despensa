// client/src/components/modules/dashboard/components/TarjetaIdea.js
import React from "react";
import { FaTrash, FaEdit, FaHeart, FaComment, FaArrowUp, FaArrowDown } from "react-icons/fa";
import Button from "../../../common/Button";
import { obtenerColorImpacto, obtenerColorEstado, obtenerIconoCategoria } from "../utils/muroUtils";
import { ESTADOS } from "../utils/constants";

/**
 * Props:
 * - idea
 * - abrirEditar(id | idea)
 * - eliminarIdea(id)
 * - darLike(id)
 * - votarIdea(id, +1 | -1)
 * - cambiarEstado(id, estado)
 */
const TarjetaIdea = ({
  idea = {},
  abrirEditar,
  eliminarIdea,
  darLike,
  votarIdea,
  cambiarEstado,
}) => {
  const {
    id,
    titulo = "Idea sin título",
    descripcion = "Sin descripción",
    categoria = "general",
    impacto = "medio",
    estado = "nueva",
    likes = 0,
    votos = 0,
    autor = "Anónimo",
    fecha,
  } = idea;

  const estadoColor = obtenerColorEstado?.(estado) || "bg-gray-100 text-gray-700";
  const impactoColor = obtenerColorImpacto?.(impacto) || "bg-gray-100 text-gray-700";
  const iconoCat = obtenerIconoCategoria?.(categoria) || "💡";

  const fechaFmt = fecha
    ? new Date(fecha).toLocaleDateString()
    : new Date().toLocaleDateString();

  const onEstadoChange = (e) => {
    const nuevo = e.target.value;
    cambiarEstado?.(id, nuevo);
  };

  return (
    <div className="group relative rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl" title={categoria}>{iconoCat}</span>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${impactoColor}`}>
            Impacto: {impacto}
          </span>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${estadoColor}`}>
            {estado.replace("_", " ")}
          </span>
        </div>

        <div className="flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
          <Button
            onClick={() => abrirEditar?.(idea)}
            className="!bg-blue-600 hover:!bg-blue-700 !text-white !px-3 !py-1.5 !rounded-xl"
            title="Editar"
          >
            <div className="flex items-center gap-2">
              <FaEdit /> <span>Editar</span>
            </div>
          </Button>
          <Button
            onClick={() => eliminarIdea?.(id)}
            className="!bg-red-600 hover:!bg-red-700 !text-white !px-3 !py-1.5 !rounded-xl"
            title="Eliminar"
          >
            <div className="flex items-center gap-2">
              <FaTrash /> <span>Eliminar</span>
            </div>
          </Button>
        </div>
      </div>

      {/* Título & descripción */}
      <h3 className="mb-1 text-lg font-semibold text-gray-900">{titulo}</h3>
      <p className="mb-3 text-sm text-gray-600">{descripcion}</p>

      {/* Meta */}
      <div className="mb-3 flex items-center justify-between text-xs text-gray-500">
        <span>Autor: <strong className="text-gray-700">{autor}</strong></span>
        <span>{fechaFmt}</span>
      </div>

      {/* Acciones base */}
      <div className="flex items-center justify-between">
        {/* Likes y votos */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => darLike?.(id)}
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition ${
              likes > 0 ? "border-red-300 bg-red-50 text-red-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
            title="Me gusta"
          >
            <FaHeart className={`${likes > 0 ? "fill-current" : ""}`} />
            <span>{likes || 0}</span>
          </button>

          <div className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2 py-1 text-sm text-gray-700">
            <button
              type="button"
              onClick={() => votarIdea?.(id, +1)}
              className="rounded p-1 hover:bg-gray-100"
              title="Voto positivo"
            >
              <FaArrowUp />
            </button>
            <span className="min-w-6 text-center font-semibold">{votos || 0}</span>
            <button
              type="button"
              onClick={() => votarIdea?.(id, -1)}
              className="rounded p-1 hover:bg-gray-100"
              title="Voto negativo"
            >
              <FaArrowDown />
            </button>
          </div>

          <div className="ml-1 inline-flex items-center gap-1 rounded-full border border-gray-200 px-2 py-1 text-sm text-gray-500">
            <FaComment />
            <span>Comentarios</span>
          </div>
        </div>

        {/* Estado */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Estado:</label>
          <select
            value={estado}
            onChange={onEstadoChange}
            className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm text-gray-800 focus:border-blue-500 focus:outline-none"
          >
            {(ESTADOS || ["nueva", "evaluando", "en_proceso", "implementada"]).map((op) => (
              <option key={op} value={op}>
                {op.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default TarjetaIdea;

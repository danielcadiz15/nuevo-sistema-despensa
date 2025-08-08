// src/pages/configuracion/ConfiguracionEmpresa.js
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

// Servicios
import configuracionService from '../../services/configuracion.service';

// Componentes
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';


// Iconos
import { 
  FaBuilding, FaSave, FaUpload, FaTimes, FaEye, 
  FaPhone, FaEnvelope, FaMapMarkerAlt, FaFileInvoice,
  FaImage, FaCog, FaCogs
} from 'react-icons/fa';

/**
 * Página de configuración de datos empresariales
 * Permite configurar todos los datos que aparecerán en las facturas
 */
const ConfiguracionEmpresa = () => {
  // Estado del formulario
  const [formData, setFormData] = useState({
    // Información básica
    razon_social: '',
    nombre_fantasia: 'CONDINEA',
    slogan: 'Especialistas en especias, condimentos e insumos para carnicerias e industria alimentaria',
    
    // Datos fiscales
    cuit: '',
    condicion_iva: 'Responsable Inscripto',
    ingresos_brutos: '',
    punto_venta: '0001',
    
    // Dirección
    direccion_calle: '',
    direccion_localidad: 'Posadas',
    direccion_provincia: 'Misiones',
    direccion_codigo_postal: '',
    direccion_pais: 'Argentina',
    
    // Contacto
    telefono_principal: '',
    telefono_secundario: '',
    email: '',
    website: '',
    
    // Configuración de facturas
    numeracion_inicial: 1,
    serie_actual: 'A',
    formato_predeterminado: 'termico',
    mostrar_logo: true,
    tamaño_logo: 'mediano',
    posicion_logo: 'centro'
  });

  // Estado para el logo
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoUrl, setLogoUrl] = useState('');
  
  // Estado de carga
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [subiendoLogo, setSubiendoLogo] = useState(false);
  
  // Estado para modal de módulos
  //const [showModulosModal, setShowModulosModal] = useState(false);

  /**
   * Cargar configuración existente al montar el componente
   */
  useEffect(() => {
    cargarConfiguracion();
  }, []);

  /**
   * Cargar configuración desde el backend
   */
  const cargarConfiguracion = async () => {
    try {
      setLoading(true);
      
      const config = await configuracionService.obtener();
      if (config) {
        setFormData(config);
        setLogoUrl(config.logo_url || '');
      }
      
    } catch (error) {
      console.error('Error al cargar configuración:', error);
      toast.error('Error al cargar la configuración');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Manejar cambios en los campos del formulario
   */
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  /**
   * Manejar selección de archivo de logo
   */
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de archivo
      const tiposPermitidos = ['image/jpeg', 'image/png', 'image/svg+xml'];
      if (!tiposPermitidos.includes(file.type)) {
        toast.error('Solo se permiten archivos JPG, PNG o SVG');
        return;
      }

      // Validar tamaño (máximo 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('El archivo debe ser menor a 2MB');
        return;
      }

      setLogoFile(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * Eliminar logo seleccionado
   */
  const eliminarLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    document.getElementById('logo-upload').value = '';
  };

  /**
   * Subir logo a Firebase Storage
   */
  const subirLogo = async () => {
    if (!logoFile) return logoUrl;

    try {
      setSubiendoLogo(true);
      
      const url = await configuracionService.subirLogo(logoFile);
      
      toast.success('Logo subido correctamente');
      return url;
      
    } catch (error) {
      console.error('Error al subir logo:', error);
      toast.error('Error al subir el logo');
      return logoUrl;
    } finally {
      setSubiendoLogo(false);
    }
  };

  /**
   * Validar formulario
   */
  const validarFormulario = () => {
    const camposRequeridos = [
      'razon_social',
      'cuit',
      'direccion_calle',
      'direccion_localidad',
      'telefono_principal',
      'email'
    ];

    for (const campo of camposRequeridos) {
      if (!formData[campo] || formData[campo].trim() === '') {
        toast.error(`El campo ${campo.replace('_', ' ')} es requerido`);
        return false;
      }
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('El formato del email no es válido');
      return false;
    }

    return true;
  };

  /**
   * Guardar configuración
   */
  const handleGuardar = async () => {
    if (!validarFormulario()) return;

    try {
      setGuardando(true);

      // Subir logo si hay uno nuevo
      const logoUrlFinal = await subirLogo();

      // Preparar datos para guardar
      const datosCompletos = {
        ...formData,
        logo_url: logoUrlFinal,
        fecha_actualizacion: new Date().toISOString()
      };

      // Verificar si es creación o actualización
      try {
        const configExistente = await configuracionService.obtener();
        if (configExistente && configExistente.razon_social) {
          // Actualizar existente
          await configuracionService.actualizar(datosCompletos);
        } else {
          // Crear nueva
          await configuracionService.guardar(datosCompletos);
        }
      } catch (error) {
        // Si hay error al obtener, intentar crear
        await configuracionService.guardar(datosCompletos);
      }

      toast.success('Configuración guardada correctamente');
      setLogoUrl(logoUrlFinal);
      setLogoFile(null);
      setLogoPreview(null);

    } catch (error) {
      console.error('Error al guardar configuración:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <FaBuilding className="mr-3 text-indigo-600" />
          Configuración Empresarial
        </h1>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>Configuración única:</strong> Estos datos aparecerán en todas las facturas y comprobantes. 
              Puedes modificarlos en cualquier momento.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel izquierdo: Información básica y fiscal */}
        <div className="space-y-6">
          {/* Información Básica */}
          <Card>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FaBuilding className="mr-2 text-indigo-600" />
              Información Básica
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Razón Social *
                </label>
                <input
                  type="text"
                  name="razon_social"
                  value={formData.razon_social}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Ej: Distribuidora CONDINEA S.A."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de Fantasía *
                </label>
                <input
                  type="text"
                  name="nombre_fantasia"
                  value={formData.nombre_fantasia}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slogan
                </label>
                <textarea
                  name="slogan"
                  value={formData.slogan}
                  onChange={handleInputChange}
                  rows={2}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </Card>

          {/* Datos Fiscales */}
          <Card>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FaFileInvoice className="mr-2 text-indigo-600" />
              Datos Fiscales
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CUIT/CUIL *
                </label>
                <input
                  type="text"
                  name="cuit"
                  value={formData.cuit}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="20-12345678-9"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Condición IVA
                </label>
                <select
                  name="condicion_iva"
                  value={formData.condicion_iva}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="Responsable Inscripto">Responsable Inscripto</option>
                  <option value="Monotributo">Monotributo</option>
                  <option value="Exento">Exento</option>
                  <option value="Consumidor Final">Consumidor Final</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ingresos Brutos
                </label>
                <input
                  type="text"
                  name="ingresos_brutos"
                  value={formData.ingresos_brutos}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Punto de Venta
                </label>
                <input
                  type="text"
                  name="punto_venta"
                  value={formData.punto_venta}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="0001"
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Panel derecho: Logo, dirección y contacto */}
        <div className="space-y-6">
          {/* Logo */}
          <Card>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FaImage className="mr-2 text-indigo-600" />
              Logo de la Empresa
            </h3>
            
            <div className="space-y-4">
              {/* Preview del logo */}
              {(logoPreview || logoUrl) && (
                <div className="flex justify-center">
                  <div className="relative">
                    <img
                      src={logoPreview || logoUrl}
                      alt="Logo preview"
                      className="h-24 w-24 object-contain border-2 border-gray-300 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={eliminarLogo}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <FaTimes size={12} />
                    </button>
                  </div>
                </div>
              )}

              {/* Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subir Logo
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <FaUpload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none">
                        <span>Subir archivo</span>
                        <input
                          id="logo-upload"
                          type="file"
                          className="sr-only"
                          accept="image/jpeg,image/png,image/svg+xml"
                          onChange={handleLogoChange}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, SVG hasta 2MB</p>
                  </div>
                </div>
              </div>

              {/* Configuración del logo */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tamaño
                  </label>
                  <select
                    name="tamaño_logo"
                    value={formData.tamaño_logo}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="pequeño">Pequeño</option>
                    <option value="mediano">Mediano</option>
                    <option value="grande">Grande</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Posición
                  </label>
                  <select
                    name="posicion_logo"
                    value={formData.posicion_logo}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="izquierda">Izquierda</option>
                    <option value="centro">Centro</option>
                    <option value="derecha">Derecha</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="mostrar_logo"
                  checked={formData.mostrar_logo}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Mostrar logo en las facturas
                </label>
              </div>
            </div>
          </Card>

          {/* Dirección */}
          <Card>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FaMapMarkerAlt className="mr-2 text-indigo-600" />
              Dirección
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Calle y Número *
                </label>
                <input
                  type="text"
                  name="direccion_calle"
                  value={formData.direccion_calle}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Av. Principal 123"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Localidad *
                  </label>
                  <input
                    type="text"
                    name="direccion_localidad"
                    value={formData.direccion_localidad}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Provincia/Estado
                  </label>
                  <input
                    type="text"
                    name="direccion_provincia"
                    value={formData.direccion_provincia}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código Postal
                  </label>
                  <input
                    type="text"
                    name="direccion_codigo_postal"
                    value={formData.direccion_codigo_postal}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    País
                  </label>
                  <input
                    type="text"
                    name="direccion_pais"
                    value={formData.direccion_pais}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Contacto */}
          <Card>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FaPhone className="mr-2 text-indigo-600" />
              Información de Contacto
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono Principal *
                  </label>
                  <input
                    type="tel"
                    name="telefono_principal"
                    value={formData.telefono_principal}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="+54 376 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono Secundario
                  </label>
                  <input
                    type="tel"
                    name="telefono_secundario"
                    value={formData.telefono_secundario}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="contacto@condinea.com.ar"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sitio Web
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="www.condinea.com.ar"
                />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Configuración de Facturas */}
      <Card>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <FaCog className="mr-2 text-indigo-600" />
          Configuración de Facturas
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Numeración Inicial
            </label>
            <input
              type="number"
              name="numeracion_inicial"
              value={formData.numeracion_inicial}
              onChange={handleInputChange}
              min="1"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Serie Actual
            </label>
            <select
              name="serie_actual"
              value={formData.serie_actual}
              onChange={handleInputChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="X">X</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Formato Predeterminado
            </label>
            <select
              name="formato_predeterminado"
              value={formData.formato_predeterminado}
              onChange={handleInputChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="termico">Térmico (80mm)</option>
              <option value="a4">A4</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Card de Módulos del Sistema */}
      <Card>
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center">
              <FaCogs className="mr-2 text-indigo-600" />
              Módulos del Sistema
            </h3>
            <p className="text-sm text-gray-600">
              Activa o desactiva funcionalidades según las necesidades de tu empresa
            </p>
          </div>
          <Button
            color="primary"
            //onClick={() => setShowModulosModal(true)}
            icon={<FaCogs />}
          >
            Gestionar Módulos
          </Button>
        </div>
      </Card>

      {/* Botones de acción */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={handleGuardar}
          disabled={guardando || subiendoLogo}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {guardando || subiendoLogo ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {subiendoLogo ? 'Subiendo logo...' : 'Guardando...'}
            </>
          ) : (
            <>
              <FaSave className="mr-2" />
              Guardar Configuración
            </>
          )}
        </button>
      </div>

     
          // Aquí podrías recargar la configuración si es necesario
        }}
      />
    </div>
  );
};

export default ConfiguracionEmpresa;
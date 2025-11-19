// ========= Helper Google Analytics 4 =========
function trackGA4(eventName, params = {}) {
  if (window.gtag) {
    gtag('event', eventName, params);
  } else if (window.dataLayer) {
    window.dataLayer.push({ event: eventName, ...params });
  } else {
    console.log('GA4 event:', eventName, params);
  }
}

// Asignar listeners GA4 genéricos
document.querySelectorAll('[data-ga4-event]').forEach(el => {
  const eventName = el.dataset.ga4Event;

  let domEvent = 'change';
  if (el.tagName === 'FORM') {
    domEvent = 'submit';
  } else if (el.tagName === 'BUTTON') {
    domEvent = 'click';
  } else if (el.tagName === 'INPUT' &&
            (el.type === 'text' || el.type === 'email' || el.type === 'tel')) {
    domEvent = 'blur';
  }

  el.addEventListener(domEvent, () => {
    trackGA4(eventName, {
      field_id: el.id || null,
      field_name: el.name || null
    });
  });
});

const formulario = document.getElementById('registroForm');
const enviarBtn = document.querySelector('.boton-enviar');

// ========= Validación campos de texto flotantes =========
const floatingInputs = document.querySelectorAll('.campo.flotante input');

function esCampoTextoValido(input) {
  const valor = input.value.trim();
  const tipo = input.dataset.tipoValidacion;

  if (!input.required && !valor) return true;

  let esValido = false;

  if (tipo === 'texto-min2') {
    esValido = valor.length >= 2;
  } else if (tipo === 'email') {
    esValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
  } else if (tipo === 'telefono') {
    esValido = /^[0-9+\s-]{6,}$/.test(valor);
  } else {
    esValido = true;
  }

  return esValido;
}

floatingInputs.forEach(input => {
  const campo = input.closest('.campo');

  input.addEventListener('blur', () => {
    campo.classList.add('tocado');
    validarCampoFlotante(input);
    actualizarEstadoBotonEnvio();
  });

  input.addEventListener('input', () => {
    if (campo.classList.contains('tocado')) {
      validarCampoFlotante(input);
    } else {
      actualizarEstadoVisual(input, false, false);
    }
    actualizarEstadoBotonEnvio();
  });
});

function validarCampoFlotante(input) {
  const esValido = esCampoTextoValido(input);
  actualizarEstadoVisual(input, esValido, true);
  return esValido;
}

function actualizarEstadoVisual(input, esValido, mostrarError) {
  const campo = input.closest('.campo');
  const icono = campo.querySelector('.icono-validacion');
  const mensajeError = campo.querySelector('.mensaje-error');

  campo.classList.remove('valid', 'invalid');

  if (icono) icono.textContent = '';

  if (!input.value.trim()) {
    input.setAttribute('aria-invalid', 'false');
    if (mensajeError) mensajeError.style.display = 'none';
    return;
  }

  if (esValido) {
    campo.classList.add('valid');
    input.setAttribute('aria-invalid', 'false');
    if (mensajeError) mensajeError.style.display = 'none';
  } else if (mostrarError) {
    campo.classList.add('invalid');
    input.setAttribute('aria-invalid', 'true');
    if (mensajeError) mensajeError.style.display = 'block';
  }
}

// ========= Selects: Prefijo, País, Provincia, Localidad, Curso =========
const prefijoCampo = document.querySelector('.campo-prefijo');
const prefijoSelect = document.getElementById('prefijo');
const prefijoFlag = document.querySelector('.prefijo-flag');

const paisCampo = document.querySelector('.campo-pais');
const paisSelect = document.getElementById('pais-centro');

const provinciaCampo = document.querySelector('.campo-provincia');
const provinciaSelect = document.getElementById('provincia-centro');

const localidadCampo = document.querySelector('.campo-localidad');
const localidadSelect = document.getElementById('localidad-centro');

const cursoCampo = document.querySelector('.campo-curso');
const cursoSelect = document.getElementById('curso-inicio');

// Titulación de interés
const titulacionCampo = document.querySelector('.campo-titulacion');
const titulacionHiddenInput = document.getElementById('titulacion-interes');
const titulacionTrigger = document.getElementById('titulacion-trigger');
const titulacionTextoSpan = document.querySelector('.pseudo-select-texto');

// Provincias por país (ejemplo representativo)
const provinciasPorPais = {
  'España': ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Zaragoza'],
  'Francia': ['Île-de-France', 'Occitania', 'Nueva Aquitania'],
  'Italia': ['Lombardía', 'Lacio', 'Veneto'],
  'Alemania': ['Baviera', 'Berlín', 'Hamburgo'],
  'Portugal': ['Lisboa', 'Oporto', 'Algarve'],
  'Reino Unido': ['Inglaterra', 'Escocia', 'Gales'],
  'México': [
    'Ciudad de México',
    'Estado de México',
    'Jalisco',
    'Nuevo León',
    'Puebla'
  ],
  'Estados Unidos': ['California', 'Florida', 'Nueva York', 'Texas'],
  'Brasil': ['São Paulo', 'Río de Janeiro', 'Bahía'],
  'Argentina': ['Buenos Aires', 'Córdoba', 'Santa Fe'],
  'Chile': ['Santiago', 'Valparaíso', 'Biobío'],
  'Japón': ['Tokio', 'Osaka', 'Hokkaido'],
  'China': ['Pekín', 'Shanghái', 'Guangdong'],
  'Australia': ['Nueva Gales del Sur', 'Victoria', 'Queensland'],
  'Canadá': ['Ontario', 'Quebec', 'Columbia Británica'],
  'Colombia': ['Bogotá D.C.', 'Antioquia', 'Valle del Cauca'],
  'Perú': ['Lima', 'Cusco', 'Arequipa'],
  'India': ['Maharashtra', 'Delhi', 'Karnataka'],
  'Sudáfrica': ['Gauteng', 'Cabo Occidental', 'KwaZulu-Natal'],
  'Egipto': ['El Cairo', 'Giza', 'Alejandría']
};

// Localidades mexicanas para Estado de México
const localidadesEstadoMexico = [
  'Ecatepec de Morelos',
  'Nezahualcóyotl',
  'Naucalpan de Juárez',
  'Toluca de Lerdo',
  'Tlalnepantla de Baz',
  'Metepec',
  'Cuautitlán Izcalli',
  'Texcoco',
  'Chimalhuacán',
  'Huixquilucan'
];

// Helper: ¿select válido?
function esSelectValido(select, campoWrapper) {
  if (!select || !campoWrapper) return true;
  if (campoWrapper.style.display === 'none') return true;
  if (!select.required) return true;
  return !!select.value;
}

/* ==== Estado "abierto" para TODOS los selects (chevron up) ==== */
const selectsInteractivos = document.querySelectorAll('.campo-select select');
selectsInteractivos.forEach(select => {
  const campo = select.closest('.campo-select');
  if (!campo) return;

  select.addEventListener('focus', () => {
    campo.classList.add('abierto');
  });

  select.addEventListener('blur', () => {
    campo.classList.remove('abierto');
  });
});

// Prefijo
if (prefijoSelect && prefijoCampo) {
  prefijoSelect.addEventListener('change', () => {
    prefijoCampo.classList.add('tocado');
    validarSelect(prefijoSelect, prefijoCampo);
    actualizarTextoPrefijo(prefijoSelect);
    actualizarEstadoBotonEnvio();
  });
}

// País
if (paisSelect && paisCampo) {
  paisSelect.addEventListener('change', () => {
    paisCampo.classList.add('tocado');
    validarSelect(paisSelect, paisCampo);
    actualizarProvincias();
    actualizarEstadoBotonEnvio();
  });
}

// Provincia
if (provinciaSelect && provinciaCampo) {
  provinciaSelect.addEventListener('change', () => {
    provinciaCampo.classList.add('tocado');
    validarSelect(provinciaSelect, provinciaCampo);
    actualizarVisibilidadLocalidad();
    actualizarEstadoBotonEnvio();
  });
}

// Localidad
if (localidadSelect && localidadCampo) {
  localidadSelect.addEventListener('change', () => {
    localidadCampo.classList.add('tocado');
    validarSelect(localidadSelect, localidadCampo);
    actualizarEstadoBotonEnvio();
  });
}

// Curso
if (cursoSelect && cursoCampo) {
  cursoSelect.addEventListener('change', () => {
    cursoCampo.classList.add('tocado');
    validarSelect(cursoSelect, cursoCampo);
    actualizarEstadoBotonEnvio();
  });
}

function validarSelect(select, campoWrapper) {
  const valor = select.value;
  const mensajeError = campoWrapper.querySelector('.mensaje-error');

  campoWrapper.classList.remove('valid', 'invalid', 'tiene-valor');

  if (!select.required && !valor) {
    select.setAttribute('aria-invalid', 'false');
    if (mensajeError) mensajeError.style.display = 'none';
    return;
  }

  if (valor) {
    campoWrapper.classList.add('valid', 'tiene-valor');
    select.setAttribute('aria-invalid', 'false');
    if (mensajeError) mensajeError.style.display = 'none';
  } else {
    campoWrapper.classList.add('invalid');
    select.setAttribute('aria-invalid', 'true');
    if (mensajeError) mensajeError.style.display = 'block';
  }
}

// Prefijo: mostrar bandera + prefijo
function actualizarTextoPrefijo(select) {
  if (!prefijoCampo) return;

  const opcion = select.selectedOptions[0];

  if (!opcion || !select.value) {
    prefijoCampo.classList.remove('tiene-valor');
    if (prefijoFlag) prefijoFlag.textContent = '';
    return;
  }

  const flag = opcion.dataset.flag;
  const prefix = opcion.dataset.prefix;

  if (flag && prefix) {
    if (prefijoFlag) {
      prefijoFlag.textContent = flag;
    }
    opcion.textContent = prefix;
  }

  prefijoCampo.classList.add('tiene-valor');
}

// Actualizar provincias
function actualizarProvincias() {
  if (!provinciaSelect || !provinciaCampo) return;

  const pais = paisSelect ? paisSelect.value : '';
  const provincias = provinciasPorPais[pais] || [];

  provinciaSelect.innerHTML = '';
  const emptyOption = document.createElement('option');
  emptyOption.value = '';
  provinciaSelect.appendChild(emptyOption);

  if (!pais || provincias.length === 0) {
    provinciaSelect.disabled = true;
    provinciaSelect.required = false;
    provinciaCampo.style.display = 'none';
    provinciaCampo.classList.remove('valid', 'invalid', 'tiene-valor', 'tocado');
    provinciaSelect.setAttribute('aria-invalid', 'false');
    const msg = provinciaCampo.querySelector('.mensaje-error');
    if (msg) msg.style.display = 'none';
  } else {
    provinciaSelect.disabled = false;
    provinciaSelect.required = true;
    provinciaCampo.style.display = '';
    provincias.forEach(prov => {
      const opt = document.createElement('option');
      opt.value = prov;
      opt.textContent = prov;
      provinciaSelect.appendChild(opt);
    });
  }

  provinciaSelect.value = '';
  actualizarVisibilidadLocalidad();
}

// Localidad visible solo México + Estado de México
function actualizarVisibilidadLocalidad() {
  if (!localidadCampo || !localidadSelect || !paisSelect || !provinciaSelect) return;

  const pais = paisSelect.value;
  const provincia = provinciaSelect.value;

  const debeMostrar =
    pais === 'México' &&
    provincia === 'Estado de México';

  if (debeMostrar) {
    localidadCampo.style.display = '';
    localidadSelect.required = true;
    localidadSelect.setAttribute('aria-required', 'true');

    localidadSelect.innerHTML = '';
    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    localidadSelect.appendChild(emptyOption);

    localidadesEstadoMexico.forEach(loc => {
      const opt = document.createElement('option');
      opt.value = loc;
      opt.textContent = loc;
      localidadSelect.appendChild(opt);
    });

    localidadCampo.classList.remove('valid', 'invalid', 'tiene-valor', 'tocado');
    const msg = localidadCampo.querySelector('.mensaje-error');
    if (msg) msg.style.display = 'none';
  } else {
    localidadCampo.style.display = 'none';
    localidadSelect.required = false;
    localidadSelect.setAttribute('aria-required', 'false');
    localidadSelect.value = '';
    localidadCampo.classList.remove('valid', 'invalid', 'tiene-valor', 'tocado');
    const msg = localidadCampo.querySelector('.mensaje-error');
    if (msg) msg.style.display = 'none';
  }
}

// ========= Modal Aviso Legal =========
const enlaceAviso = document.getElementById('enlace-aviso');
const modalAviso = document.getElementById('modal-aviso');
const cerrarModalBtn = document.querySelector('.cerrar-modal');

function abrirModalAviso(e) {
  if (e) e.preventDefault();
  if (!modalAviso || !formulario) return;

  const rectForm = formulario.getBoundingClientRect();
  const modalContenido = modalAviso.querySelector('.modal-contenido');
  modalContenido.style.width = rectForm.width + 'px';

  modalAviso.style.display = 'flex';
  modalAviso.setAttribute('aria-hidden', 'false');

  const titulo = modalAviso.querySelector('#modal-aviso-titulo');
  if (titulo) titulo.focus();
}

function cerrarModalAviso() {
  if (!modalAviso) return;
  modalAviso.style.display = 'none';
  modalAviso.setAttribute('aria-hidden', 'true');
}

if (enlaceAviso) {
  enlaceAviso.addEventListener('click', abrirModalAviso);
}

if (cerrarModalBtn) {
  cerrarModalBtn.addEventListener('click', cerrarModalAviso);
}

// ========= Modal Mi titulación de interés =========
const modalTitulacion = document.getElementById('modal-titulacion');
const cerrarModalTitulacionBtn = document.querySelector('.cerrar-modal-titulacion');
const filtroTitulacionesInput = document.getElementById('filtro-titulaciones');
const listaTitulacionesContainer = document.getElementById('lista-titulaciones');

const areasTitulaciones = [
  {
    nombre: 'Área de ciencias naturales y biosanitarias',
    titulaciones: [
      'Grado en Enfermería',
      'Grado en Medicina',
      'Grado en Química',
      'Doble Grado Administración y Dirección de Empresas',
      'Grado en Nutrición Humana y Dietética',
      'Grado en Ciencias Ambientales'
    ]
  },
  {
    nombre: 'Área de ciencias sociales',
    titulaciones: [
      'Grado en Marketing',
      'Grado en Derecho',
      'Grado en Filosofía, Política y Economía (Philosophy, Politics and Economics)',
      'Grado en Educación Primaria'
    ]
  },
  {
    nombre: 'Área de ingeniería y arquitectura',
    titulaciones: [
      'Grado en Ingeniería Informática',
      'Grado en Ingeniería Industrial'
    ]
  }
];

let areaTitulacionNodes = [];

// Construir lista de titulaciones
function inicializarListaTitulaciones() {
  if (!listaTitulacionesContainer) return;

  listaTitulacionesContainer.innerHTML = '';

  areasTitulaciones.forEach(area => {
    const areaDiv = document.createElement('div');
    areaDiv.className = 'area-titulaciones';
    areaDiv.dataset.areaNombre = area.nombre;

    const tituloArea = document.createElement('div');
    tituloArea.className = 'area-titulo';
    tituloArea.textContent = area.nombre;
    areaDiv.appendChild(tituloArea);

    area.titulaciones.forEach(tit => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'item-titulacion';
      btn.textContent = tit;
      btn.dataset.titulacion = tit;
      areaDiv.appendChild(btn);
    });

    listaTitulacionesContainer.appendChild(areaDiv);
  });

  areaTitulacionNodes = Array.from(
    listaTitulacionesContainer.querySelectorAll('.area-titulaciones')
  );
}

function abrirModalTitulacion(e) {
  if (e) e.preventDefault();
  if (!modalTitulacion || !formulario) return;

  const rectForm = formulario.getBoundingClientRect();
  const modalContenido = modalTitulacion.querySelector('.modal-contenido');
  modalContenido.style.width = rectForm.width + 'px';

  modalTitulacion.style.display = 'flex';
  modalTitulacion.setAttribute('aria-hidden', 'false');
  if (titulacionTrigger) {
    titulacionTrigger.setAttribute('aria-expanded', 'true');
  }
  if (titulacionCampo) {
    titulacionCampo.classList.add('abierto');
  }

  if (filtroTitulacionesInput) {
    filtroTitulacionesInput.value = '';
  }
  filtrarTitulaciones();

  const titulo = modalTitulacion.querySelector('#modal-titulacion-titulo');
  if (titulo) titulo.focus();
}

function cerrarModalTitulacion() {
  if (!modalTitulacion) return;
  modalTitulacion.style.display = 'none';
  modalTitulacion.setAttribute('aria-hidden', 'true');
  if (titulacionTrigger) {
    titulacionTrigger.setAttribute('aria-expanded', 'false');
    titulacionTrigger.focus();
  }
  if (titulacionCampo) {
    titulacionCampo.classList.remove('abierto');
  }
}

if (titulacionTrigger) {
  titulacionTrigger.addEventListener('click', abrirModalTitulacion);
}

if (cerrarModalTitulacionBtn) {
  cerrarModalTitulacionBtn.addEventListener('click', cerrarModalTitulacion);
}

// Filtrado de titulaciones
function filtrarTitulaciones() {
  if (!filtroTitulacionesInput || !areaTitulacionNodes.length) return;

  const filtro = filtroTitulacionesInput.value.trim().toLowerCase();

  areaTitulacionNodes.forEach(area => {
    const items = area.querySelectorAll('.item-titulacion');
    let hayVisibles = false;

    items.forEach(btn => {
      const texto = btn.textContent.toLowerCase();
      const coincide = texto.includes(filtro);
      btn.style.display = coincide ? '' : 'none';
      if (coincide) hayVisibles = true;
    });

    area.style.display = hayVisibles ? '' : 'none';
  });
}

if (filtroTitulacionesInput) {
  filtroTitulacionesInput.addEventListener('input', filtrarTitulaciones);
}

// Selección de titulación (delegación)
if (listaTitulacionesContainer) {
  listaTitulacionesContainer.addEventListener('click', (e) => {
    const boton = e.target.closest('.item-titulacion');
    if (!boton) return;

    const valor = boton.dataset.titulacion || boton.textContent.trim();
    seleccionarTitulacion(valor);
  });
}

function seleccionarTitulacion(valor) {
  if (!titulacionCampo || !titulacionHiddenInput) return;

  if (titulacionTextoSpan) {
    titulacionTextoSpan.textContent = valor;
  }

  titulacionHiddenInput.value = valor;
  titulacionCampo.classList.add('valid', 'tiene-valor');
  titulacionCampo.classList.remove('invalid');
  titulacionHiddenInput.setAttribute('aria-invalid', 'false');

  const msg = document.getElementById('error-titulacion');
  if (msg) msg.style.display = 'none';

  // GA4
  titulacionHiddenInput.dispatchEvent(new Event('change'));

  cerrarModalTitulacion();
  actualizarEstadoBotonEnvio();
}

// ========= Cerrar modales con ESC y clic fuera =========
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (modalAviso && modalAviso.style.display === 'flex') {
      cerrarModalAviso();
    } else if (modalTitulacion && modalTitulacion.style.display === 'flex') {
      cerrarModalTitulacion();
    }
  }
});

if (modalAviso) {
  modalAviso.addEventListener('click', (e) => {
    if (e.target === modalAviso) {
      cerrarModalAviso();
    }
  });
}

if (modalTitulacion) {
  modalTitulacion.addEventListener('click', (e) => {
    if (e.target === modalTitulacion) {
      cerrarModalTitulacion();
    }
  });
}

// ========= Activación / desactivación botón ENVIAR =========
const avisoCheckbox = document.getElementById('aviso');
const perfilRadios = document.querySelectorAll('input[name="perfil"]');

if (avisoCheckbox) {
  avisoCheckbox.addEventListener('change', actualizarEstadoBotonEnvio);
}

perfilRadios.forEach(radio => {
  radio.addEventListener('change', actualizarEstadoBotonEnvio);
});

function esTitulacionValida() {
  if (!titulacionHiddenInput || !titulacionCampo) return true;
  return !!titulacionHiddenInput.value.trim();
}

function actualizarEstadoBotonEnvio() {
  if (!enviarBtn) return;

  let listo = true;

  // Campos de texto
  floatingInputs.forEach(input => {
    if (!esCampoTextoValido(input)) {
      listo = false;
    }
  });

  // Selects
  if (!esSelectValido(prefijoSelect, prefijoCampo)) listo = false;
  if (!esSelectValido(paisSelect, paisCampo)) listo = false;
  if (!esSelectValido(provinciaSelect, provinciaCampo)) listo = false;
  if (!esSelectValido(localidadSelect, localidadCampo)) listo = false;
  if (!esSelectValido(cursoSelect, cursoCampo)) listo = false;

  // Titulación
  if (!esTitulacionValida()) listo = false;

  // Perfil
  const perfilSeleccionado = Array.from(perfilRadios).some(radio => radio.checked);
  if (!perfilSeleccionado) listo = false;

  // Aviso legal
  if (!avisoCheckbox || !avisoCheckbox.checked) listo = false;

  enviarBtn.disabled = !listo;
  enviarBtn.classList.toggle('boton-activo', listo);
}

// ========= Envío del formulario =========
formulario.addEventListener('submit', (e) => {
  let formularioValido = true;
  let primerInvalido = null;

  // Validar campos de texto
  floatingInputs.forEach(input => {
    const campo = input.closest('.campo');
    campo.classList.add('tocado');
    const esValido = validarCampoFlotante(input);
    if (!esValido && formularioValido) {
      formularioValido = false;
      primerInvalido = input;
    }
  });

  // Validar selects básicos
  if (prefijoSelect && prefijoCampo) {
    prefijoCampo.classList.add('tocado');
    validarSelect(prefijoSelect, prefijoCampo);
    if (prefijoCampo.classList.contains('invalid') && formularioValido) {
      formularioValido = false;
      primerInvalido = prefijoSelect;
    }
  }

  if (paisSelect && paisCampo) {
    paisCampo.classList.add('tocado');
    validarSelect(paisSelect, paisCampo);
    if (paisCampo.classList.contains('invalid') && formularioValido) {
      formularioValido = false;
      primerInvalido = paisSelect;
    }
  }

  if (provinciaSelect && provinciaCampo && provinciaCampo.style.display !== 'none') {
    provinciaCampo.classList.add('tocado');
    validarSelect(provinciaSelect, provinciaCampo);
    if (provinciaCampo.classList.contains('invalid') && formularioValido) {
      formularioValido = false;
      primerInvalido = provinciaSelect;
    }
  }

  if (localidadSelect && localidadCampo &&
      localidadCampo.style.display !== 'none' &&
      localidadSelect.required) {
    localidadCampo.classList.add('tocado');
    validarSelect(localidadSelect, localidadCampo);
    if (localidadCampo.classList.contains('invalid') && formularioValido) {
      formularioValido = false;
      primerInvalido = localidadSelect;
    }
  }

  if (cursoSelect && cursoCampo) {
    cursoCampo.classList.add('tocado');
    validarSelect(cursoSelect, cursoCampo);
    if (cursoCampo.classList.contains('invalid') && formularioValido) {
      formularioValido = false;
      primerInvalido = cursoSelect;
    }
  }

  // Validar titulación
  if (titulacionCampo && titulacionHiddenInput) {
    titulacionCampo.classList.add('tocado');
    if (!titulacionHiddenInput.value.trim()) {
      titulacionCampo.classList.add('invalid');
      titulacionCampo.classList.remove('valid');
      titulacionHiddenInput.setAttribute('aria-invalid', 'true');
      const msg = document.getElementById('error-titulacion');
      if (msg) msg.style.display = 'block';
      if (formularioValido) {
        formularioValido = false;
        primerInvalido = titulacionTrigger || titulacionHiddenInput;
      }
    } else {
      titulacionCampo.classList.add('valid');
      titulacionCampo.classList.remove('invalid');
      titulacionHiddenInput.setAttribute('aria-invalid', 'false');
    }
  }

  // Perfil
  const perfilSeleccionado = Array.from(perfilRadios).some(radio => radio.checked);
  if (!perfilSeleccionado) {
    formularioValido = false;
    if (!primerInvalido && perfilRadios[0]) {
      primerInvalido = perfilRadios[0];
    }
    alert('Seleccione un tipo de perfil.');
  }

  // Aviso legal
  if (!avisoCheckbox || !avisoCheckbox.checked) {
    formularioValido = false;
    if (!primerInvalido && avisoCheckbox) {
      primerInvalido = avisoCheckbox;
    }
    alert('Debe aceptar el aviso legal.');
  }

  if (!formularioValido) {
    e.preventDefault();
    if (primerInvalido && typeof primerInvalido.focus === 'function') {
      primerInvalido.focus();
    }
    actualizarEstadoBotonEnvio();
    return;
  }

  e.preventDefault();
  trackGA4('formulario_enviado', { form_id: formulario.id });
  alert('Formulario enviado correctamente (prototipo).');
});

// Inicializaciones
inicializarListaTitulaciones();
actualizarEstadoBotonEnvio();

// En public/js/despacho.js

// Almacén local para las direcciones cargadas
let direccionesGuardadas = []; 

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicialización de datos
    cargarDirecciones();
    cargarTotalPedido();

    // 2. Event Listeners para formularios y acciones
    const formDireccion = document.getElementById('form-direccion');
    if (formDireccion) {
        formDireccion.addEventListener('submit', manejarFormularioDireccion);
    }
    
    document.getElementById('mostrar-form-agregar').addEventListener('click', () => mostrarFormularioAgregar(false)); // False para crear nuevo
    document.getElementById('select-direccion').addEventListener('change', seleccionarDireccionDesdeDropdown);
    document.getElementById('actualizar-direccion-btn').addEventListener('click', llenarFormularioParaActualizar);
    document.getElementById('confirmar-checkout-btn').addEventListener('click', iniciarProcesoPago);
});


// Helper para obtener el token JWT
function getToken() {
    return localStorage.getItem('userToken');
}

// Helper para establecer texto de forma segura
const setTextContentSafely = (id, text) => {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = text;
    }
};

// =========================================================
// 1. LÓGICA DE CARGA DE DATOS (TOTAL Y DIRECCIONES)
// =========================================================

async function cargarTotalPedido() {
    const token = getToken();
    
    if (!token) {
        setTextContentSafely('total-a-pagar', 'Inicie sesión');
        return;
    }

    try {
        // Llama a GET /api/carrito para obtener el total calculado
        const response = await fetch('/api/carrito', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'No se pudo obtener el total del carrito.');
        }

        const data = await response.json();
        const total = data.total; 

        // Formato a moneda chilena (CLP)
        setTextContentSafely('total-a-pagar', total.toLocaleString('es-CL') + ' CLP');
        
    } catch (error) {
        console.error('Error al cargar el total del pedido:', error);
        setTextContentSafely('total-a-pagar', 'Error al cargar');
        alert(`Fallo en la conexión: ${error.message}`);
    }
}

async function cargarDirecciones() {
    const token = getToken();
    const selectElement = document.getElementById('select-direccion');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        // Llama a GET /api/direcciones (Ruta corregida)
        const response = await fetch('/api/direcciones', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                // Si el token falló, forzamos el re-login
                localStorage.removeItem('userToken');
                alert('Sesión expirada. Por favor, inicia sesión de nuevo.');
                window.location.href = 'login.html';
                return;
            }
            throw new Error(`Error ${response.status} al cargar direcciones.`);
        }

        direccionesGuardadas = await response.json();
        selectElement.innerHTML = '<option value="">Selecciona una dirección guardada</option>';

        if (direccionesGuardadas.length > 0) {
            direccionesGuardadas.forEach(dir => {
                const option = document.createElement('option');
                option.value = dir._id;
                option.textContent = `${dir.etiqueta}: ${dir.calle} #${dir.numero}, ${dir.comuna}`;
                selectElement.appendChild(option);
            });
            
            // Seleccionar y mostrar la primera dirección por defecto
            selectElement.value = direccionesGuardadas[0]._id;
            seleccionarDireccion(direccionesGuardadas[0]);

            // Asegurar que el formulario esté oculto y los selectores visibles
            document.getElementById('form-direccion').style.display = 'none';
            document.getElementById('select-direccion-container').style.display = 'block';
            document.getElementById('mostrar-form-agregar').style.display = 'block';

        } else {
            // Si no hay direcciones, forzar la vista de agregar
            mostrarFormularioAgregar(true); // True para forzar la visibilidad del form
            document.getElementById('select-direccion-container').style.display = 'none';
        }

    } catch (error) {
        console.error('Error al cargar direcciones:', error);
        alert(`Error al cargar sus direcciones guardadas. Revise la consola: ${error.message}`);
    }
}

// =========================================================
// 2. LÓGICA DE FORMULARIO Y VISIBILIDAD
// =========================================================

function seleccionarDireccionDesdeDropdown(e) {
    const direccionId = e.target.value;
    if (direccionId) {
        const direccion = direccionesGuardadas.find(d => d._id === direccionId);
        seleccionarDireccion(direccion);
        document.getElementById('form-direccion').style.display = 'none';
        document.getElementById('mostrar-form-agregar').style.display = 'block';
    } else {
        document.getElementById('detalle-direccion-actual').style.display = 'none';
    }
}

function llenarFormularioParaActualizar() {
    const direccionId = document.getElementById('select-direccion').value;
    if (!direccionId) {
        return alert('Por favor, selecciona una dirección para editar.');
    }
    
    const dir = direccionesGuardadas.find(d => d._id === direccionId);
    
    // Llenar formulario con datos del objeto
    document.getElementById('direccion-id').value = dir._id; // ID oculto para actualización
    document.getElementById('etiqueta').value = dir.etiqueta;
    document.getElementById('nombre_receptor').value = dir.nombre_receptor; // <-- Campo Nuevo
    document.getElementById('rut').value = dir.rut_receptor;
    document.getElementById('correo').value = dir.correo_receptor;
    document.getElementById('direccion').value = dir.calle;
    document.getElementById('numero').value = dir.numero;
    document.getElementById('comuna').value = dir.comuna;
    document.getElementById('region').value = dir.region;

    mostrarFormularioAgregar(true); // Mostrar el formulario para edición
}

function mostrarFormularioAgregar(isInitialLoad = false) {
    if (!isInitialLoad) {
        document.getElementById('product-form').reset(); // Limpiar si es nuevo
        document.getElementById('direccion-id').value = '';
    }
    document.getElementById('form-direccion').style.display = 'block';
    document.getElementById('detalle-direccion-actual').style.display = 'none';
    document.getElementById('mostrar-form-agregar').style.display = 'none';
}


function seleccionarDireccion(direccion) {
    // Mostrar detalles en la tarjeta de resumen (usa el utilitario seguro)
    setTextContentSafely('detalle-etiqueta', direccion.etiqueta);
    setTextContentSafely('detalle-nombre', direccion.nombre_receptor);
    setTextContentSafely('detalle-rut', direccion.rut_receptor);
    setTextContentSafely('detalle-correo', direccion.correo_receptor);
    setTextContentSafely('detalle-direccion', direccion.calle);
    setTextContentSafely('detalle-numero', direccion.numero);
    setTextContentSafely('detalle-comuna', direccion.comuna);
    setTextContentSafely('detalle-region', direccion.region);

    // Guardar el ID de la dirección seleccionada para el checkout
    localStorage.setItem('direccionSeleccionadaId', direccion._id);
    const card = document.getElementById('detalle-direccion-actual');
    if (card) card.style.display = 'block';
}


// =========================================================
// 3. API: GUARDAR DIRECCIÓN Y PAGAR
// =========================================================

async function manejarFormularioDireccion(e) {
    e.preventDefault();
    const token = getToken();
    const form = e.target;
    const direccionId = document.getElementById('direccion-id').value;
    
    // Recolección de datos del formulario, incluyendo el nuevo campo nombre_receptor
    const data = {
        etiqueta: form.etiqueta.value,
        nombre_receptor: document.getElementById('nombre_receptor').value, // Lectura del nuevo campo
        rut_receptor: form.rut.value,
        correo_receptor: form.correo.value,
        calle: form.direccion.value,
        numero: form.numero.value,
        comuna: form.comuna.value,
        region: form.region.value,
    };
    
    const isUpdate = !!direccionId;
    const url = isUpdate ? `/api/direcciones/${direccionId}` : '/api/direcciones';
    const method = isUpdate ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message);
            form.reset();
            document.getElementById('direccion-id').value = '';
            form.style.display = 'none';
            cargarDirecciones(); // Recargar lista y seleccionar la nueva/actualizada
        } else {
            alert(`Error al guardar dirección: ${result.message}`);
        }

    } catch (error) {
        console.error('Error de red al guardar dirección:', error);
        alert('Error de conexión con el servidor.');
    }
}


async function iniciarProcesoPago() {
    const direccionId = localStorage.getItem('direccionSeleccionadaId');
    const token = getToken();
    
    if (!direccionId) {
        alert('Por favor, selecciona o agrega una dirección de despacho.');
        return;
    }

    try {
        // Llama a POST /api/pedidos/checkout
        const response = await fetch('/api/pedidos/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ direccion_despacho_id: direccionId })
        });
        
        const data = await response.json();

        if (response.ok) {
            alert(data.message);
            // Redirigir al punto de inicio de Mercado Pago
            window.location.href = data.init_point; 
        } else {
            alert(data.message || 'Error al procesar el pago. Verifica el stock y la dirección.');
        }

    } catch (error) {
        console.error('Error durante la finalización del checkout:', error);
        alert('Error de red al iniciar la pasarela de pago.');
    }
}
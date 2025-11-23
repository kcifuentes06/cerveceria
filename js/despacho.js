document.addEventListener('DOMContentLoaded', () => {
    cargarDirecciones();
    
    const formDireccion = document.getElementById('form-direccion');
    if (formDireccion) {
        formDireccion.addEventListener('submit', guardarDireccion);
    }
    
    document.getElementById('confirmar-checkout-btn').addEventListener('click', finalizarCheckout);
    document.getElementById('mostrar-form-agregar').addEventListener('click', () => {
        mostrarFormularioAgregar(true);
    });

    document.getElementById('select-direccion').addEventListener('change', (e) => {
        const selectedId = e.target.value;
        if (selectedId) {
            mostrarDetalleDireccion(selectedId);
            mostrarFormularioAgregar(false);
        } else {
            document.getElementById('detalle-direccion-actual').style.display = 'none';
        }
    });

    document.getElementById('actualizar-direccion-btn').addEventListener('click', (e) => {
        const selectedId = document.getElementById('select-direccion').value;
        if (selectedId) {
            llenarFormularioParaActualizar(selectedId);
            mostrarFormularioAgregar(true);
        } else {
            alert('Selecciona primero una dirección para actualizar.');
        }
    });
});

let direccionesGuardadas = []; 

function getToken() {
    return localStorage.getItem('userToken');
}

function mostrarFormularioAgregar(show) {
    document.getElementById('form-direccion').style.display = show ? 'block' : 'none';
    if (show) {
        document.getElementById('detalle-direccion-actual').style.display = 'none';
    }
}

async function cargarDirecciones() {
    const token = getToken();
    if (!token) {
        alert('Debe iniciar sesión para continuar el proceso de despacho.');
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch('/api/checkout/direcciones', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Error al cargar direcciones.');
        
        direccionesGuardadas = await response.json();
        const selectElement = document.getElementById('select-direccion');
        selectElement.innerHTML = '<option value="">Selecciona una dirección guardada</option>';
        
        if (direccionesGuardadas.length > 0) {
            direccionesGuardadas.forEach(dir => {
                const option = document.createElement('option');
                option.value = dir._id;
                option.textContent = `${dir.etiqueta}: ${dir.calle} #${dir.numero}, ${dir.comuna}`;
                selectElement.appendChild(option);
            });
            document.getElementById('select-direccion-container').style.display = 'block';
            document.getElementById('mostrar-form-agregar').style.display = 'block';
            
            selectElement.value = direccionesGuardadas[0]._id;
            mostrarDetalleDireccion(direccionesGuardadas[0]._id);
            mostrarFormularioAgregar(false);
        } else {
            
            mostrarFormularioAgregar(true);
            document.getElementById('select-direccion-container').style.display = 'none';
            document.getElementById('mostrar-form-agregar').style.display = 'none';
        }

    } catch (error) {
        console.error('Error al cargar direcciones:', error);
        alert('Error al cargar sus direcciones guardadas. Intente recargar la página.');
    }
}

function mostrarDetalleDireccion(direccionId) {
    const detalleContainer = document.getElementById('detalle-direccion-actual');
    const dir = direccionesGuardadas.find(d => d._id === direccionId);
    
    if (dir) {
        document.getElementById('detalle-etiqueta').textContent = dir.etiqueta;
        document.getElementById('detalle-rut').textContent = dir.rut_receptor;
        document.getElementById('detalle-correo').textContent = dir.correo_receptor;
        document.getElementById('detalle-direccion').textContent = dir.calle;
        document.getElementById('detalle-numero').textContent = dir.numero;
        document.getElementById('detalle-comuna').textContent = dir.comuna;
        document.getElementById('detalle-region').textContent = dir.region;
        detalleContainer.style.display = 'block';
    }
}

function llenarFormularioParaActualizar(direccionId) {
    const dir = direccionesGuardadas.find(d => d._id === direccionId);
    if (dir) {
        const form = document.getElementById('form-direccion');
        document.getElementById('direccion-id').value = dir._id; 
        form.etiqueta.value = dir.etiqueta;
        form.rut.value = dir.rut_receptor;
        form.correo.value = dir.correo_receptor;
        form.direccion.value = dir.calle;
        form.numero.value = dir.numero;
        form.comuna.value = dir.comuna;
        form.region.value = dir.region;
    }
}

async function guardarDireccion(event) {
    event.preventDefault();
    
    const token = getToken();
    const form = event.target;
    const direccionId = document.getElementById('direccion-id').value; 

    const direccionData = {
        _id: direccionId || undefined, 
        etiqueta: form.etiqueta.value,
        rut_receptor: form.rut.value,
        correo_receptor: form.correo.value,
        calle: form.direccion.value,
        numero: form.numero.value,
        comuna: form.comuna.value,
        region: form.region.value,
    };
    
    try {
        const response = await fetch('/api/checkout/direcciones', {
            method: 'POST', 
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(direccionData)
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message);
            form.reset();
            document.getElementById('direccion-id').value = ''; 
            cargarDirecciones(); 
        } else {
            alert(data.message || 'Error al guardar la dirección.');
        }

    } catch (error) {
        console.error('Error al guardar dirección:', error);
    }
}

async function finalizarCheckout() {
    const direccion_despacho_id = document.getElementById('select-direccion').value;
    const token = getToken();
    
    if (!direccion_despacho_id) {
        return alert('Por favor, selecciona o agrega una dirección de despacho válida.');
    }
    
    try {
        const response = await fetch('/api/checkout/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ direccion_despacho_id })
        });
        
        const data = await response.json();

        if (response.ok) {
            alert(`¡Pedido # ${data.pedido_id.substring(18)} creado con éxito! Total: $${data.total.toLocaleString('es-CL')}. Redirigiendo a la pasarela de pago.`);
            
            window.location.href = `resumen_pago.html?pedido=${data.pedido_id}`; 
        } else {
            alert(data.message || 'Error al finalizar el checkout. Hubo un problema con tu carrito o stock.');
        }

    } catch (error) {
        console.error('Error durante la finalización del checkout:', error);
        alert('Error de red al procesar el pedido.');
    }
}
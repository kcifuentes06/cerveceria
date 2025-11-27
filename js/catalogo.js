// En public/js/catalogo.js

document.addEventListener('DOMContentLoaded', () => {
    // CRÍTICO: Asignar listeners a los selectores para recargar la lista
    document.getElementById('filtro-tipo').addEventListener('change', cargarProductos);
    document.getElementById('filtro-cervezas').addEventListener('change', cargarProductos);
    
    // Inicia la carga al cargar la página
    cargarProductos();
});

function getToken() {
    return localStorage.getItem('userToken');
}

async function cargarProductos() {
    const catalogoElement = document.getElementById('catalogo');
    
    // Muestra el mensaje de carga inmediatamente
    catalogoElement.innerHTML = '<li class="list-group-item text-center">Cargando productos...</li>'; 

    // 1. Obtener valores de los filtros del HTML
    const filtroTipo = document.getElementById('filtro-tipo').value;
    const filtroVariedad = document.getElementById('filtro-cervezas').value;
    
    // 2. Construir la URL de la API
    let url = '/api/productos?';
    
    if (filtroTipo && filtroTipo !== 'todos') {
        url += `tipo=${filtroTipo}&`;
    }
    
    if (filtroVariedad && filtroVariedad !== 'todas') {
        url += `variedad=${filtroVariedad}&`;
    }
    
    url = url.endsWith('&') ? url.slice(0, -1) : url;

    try {
        const response = await fetch(url); 
        const productos = await response.json(); // Parsea la respuesta JSON

        // Asegúrate de que la respuesta sea un arreglo, incluso si está vacío
        if (!Array.isArray(productos)) {
            throw new Error("Respuesta inválida de la API. Se esperaba una lista.");
        }
        
        catalogoElement.innerHTML = ''; // Limpiar la lista de carga

        if (productos.length === 0) {
            catalogoElement.innerHTML = '<li class="list-group-item text-center">No se encontraron productos con esos filtros o no hay stock.</li>';
            return;
        }

        // 3. Renderizar los productos
        productos.forEach(producto => {
            const li = document.createElement('li');
            // Asegúrate de que la clase CSS sea correcta
            li.className = `list-group-item d-flex justify-content-between align-items-center producto ${producto.tipo} ${producto.variedad}`;
            
            const imageUrl = producto.imagen_url || 'img/placeholder.webp'; 
            
            li.innerHTML = `
                <div class="d-flex align-items-center">
                    <img src="${imageUrl}" class="product-img me-3" alt="${producto.nombre}">
                    <div>
                        <h5>🍺 ${producto.nombre}</h5>
                        <p class="mb-1">${producto.descripcion}</p>
                        <span class="precio">$${producto.precio.toLocaleString('es-CL')} CLP</span>
                        <p class="mb-0 text-muted" style="font-size: 0.8rem;">Stock: ${producto.stock}</p>
                    </div>
                </div>
                <button class="btn btn-success" data-product-id="${producto._id}" 
                        data-product-name="${producto.nombre}" data-product-price="${producto.precio}"
                        ${producto.stock <= 0 ? 'disabled' : ''}>
                    ${producto.stock <= 0 ? 'Agotado' : 'Agregar al carrito'}
                </button>
            `;
            
            li.querySelector('.btn-success').addEventListener('click', (e) => {
                const btn = e.target;
                agregarAlCarrito(
                    btn.getAttribute('data-product-id'),
                    btn.getAttribute('data-product-name'),
                    parseFloat(btn.getAttribute('data-product-price'))
                );
            });
            catalogoElement.appendChild(li);
        });

    } catch (error) {
        console.error('Error al cargar productos:', error);
        catalogoElement.innerHTML = '<li class="list-group-item text-center text-danger">Error de conexión o datos inválidos. Intente de nuevo.</li>';
    }
}

// ... (La función agregarAlCarrito se mantiene igual)
async function agregarAlCarrito(producto_id, nombre_producto, precio) {
    const token = getToken();
    if (!token) {
        alert('Debes iniciar sesión para agregar productos al carrito.');
        window.location.href = 'login.html'; 
        return;
    }
    
    try {
        const response = await fetch('/api/carrito', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                producto_id: producto_id,
                nombre_producto: nombre_producto,
                precio_unitario: precio,
                cantidad: 1 
            })
        });

        if (response.ok) {
            alert('Producto agregado al carrito con éxito!');
        } else {
            const data = await response.json();
            alert('Error al agregar al carrito: ' + (data.message || 'Error desconocido.'));
        }

    } catch (error) {
        console.error('Error de red:', error);
    }
}
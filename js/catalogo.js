document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();
    // Asumiendo que la función filtrarProductos está implementada en este archivo
});

function getToken() {
    return localStorage.getItem('userToken');
}

async function cargarProductos() {
    const catalogoElement = document.getElementById('catalogo');
    catalogoElement.innerHTML = ''; 
    
    // Aquí puedes incluir la lógica de filtros y búsqueda si la implementas en el backend
    try {
        const response = await fetch('/api/productos'); 
        const productos = await response.json();

        productos.forEach(producto => {
            const li = document.createElement('li');
            li.className = `list-group-item d-flex justify-content-between align-items-center producto ${producto.tipo} ${producto.variedad}`;
            li.innerHTML = `
                <div class="d-flex align-items-center">
                    <img src="${producto.imagen_url}" class="product-img me-3" alt="${producto.nombre}">
                    <div>
                        <h5>🍺 ${producto.nombre}</h5>
                        <p class="mb-1">${producto.descripcion}</p>
                        <span class="precio">$${producto.precio.toLocaleString('es-CL')} CLP</span>
                    </div>
                </div>
                <button class="btn btn-success" data-product-id="${producto._id}" 
                        data-product-name="${producto.nombre}" data-product-price="${producto.precio}">
                    Agregar al carrito
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
        catalogoElement.innerHTML = '<p class="text-danger">No se pudieron cargar los productos.</p>';
    }
}

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
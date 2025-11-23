document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();
    
    document.getElementById('filtro-tipo').addEventListener('change', cargarProductos);
    document.getElementById('filtro-cervezas').addEventListener('change', cargarProductos);
    
});

function getToken() {
    return localStorage.getItem('userToken');
}

async function cargarProductos() {
    const catalogoElement = document.getElementById('catalogo');
    catalogoElement.innerHTML = ' <li class="list-group-item text-center">Cargando productos...</li>'; 

    const filtroTipo = document.getElementById('filtro-tipo').value;
    const filtroVariedad = document.getElementById('filtro-cervezas').value;
    
    let url = '/api/productos?';
    if (filtroTipo !== 'todos') url += `tipo=${filtroTipo}&`;
    if (filtroVariedad !== 'todas') url += `variedad=${filtroVariedad}&`;

    try {
        const response = await fetch(url); 
        const productos = await response.json();

        catalogoElement.innerHTML = ''; 

        if (productos.length === 0) {
            catalogoElement.innerHTML = '<li class="list-group-item text-center">No se encontraron productos con esos filtros.</li>';
            return;
        }

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
        catalogoElement.innerHTML = '<li class="list-group-item text-center text-danger">No se pudieron cargar los productos.</li>';
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
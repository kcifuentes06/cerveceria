const API_URL = '/api/productos/admin';
const API_URL_PUBLIC = '/api/productos';

const getToken = () => localStorage.getItem('userToken');


async function loadProducts() {
    const token = getToken();
    const tableBody = document.getElementById('productos-table-body');
    tableBody.innerHTML = ''; 

    if (!token) {
        alert('No autorizado. Por favor, inicie sesión.');
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(API_URL, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 403) {
            alert('Acceso denegado. Se requieren permisos de administrador.');
            window.location.href = 'login.html';
            return;
        }

        const products = await response.json();
        
        if (Array.isArray(products)) {
            products.forEach(product => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${product._id.slice(-4)}</td>
                    <td><img src="${product.imagen_url || 'img/placeholder.webp'}" class="product-img-admin" alt="${product.nombre}"></td>
                    <td>${product.nombre}</td>
                    <td>$${product.precio.toLocaleString('es-CL')}</td>
                    <td>${product.stock}</td>
                    <td>${product.tipo} (${product.variedad})</td>
                    <td>
                        <button class="btn btn-sm btn-info edit-btn" data-id="${product._id}" data-bs-toggle="modal" data-bs-target="#productModal">Editar</button>
                        <button class="btn btn-sm btn-danger delete-btn" data-id="${product._id}">Eliminar</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });

            attachEventListeners();
        } else {
            alert('Error: La respuesta de la API no es un arreglo de productos.');
        }

    } catch (error) {
        console.error('Error al cargar productos:', error);
        alert('Error al conectar con el servidor API o al cargar datos.');
    }
}

const clearForm = () => {
    document.getElementById('product-form').reset();
    document.getElementById('product-id').value = '';
    document.getElementById('productModalLabel').textContent = 'Crear Nuevo Producto';
};

document.getElementById('product-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const token = getToken();
    const productId = document.getElementById('product-id').value;
    const isEditing = !!productId; 
    
    const productData = {
        nombre: document.getElementById('nombre').value,
        descripcion: document.getElementById('descripcion').value,
        precio: parseInt(document.getElementById('precio').value),
        stock: parseInt(document.getElementById('stock').value),
        tipo: document.getElementById('tipo').value,
        variedad: document.getElementById('variedad').value || 'n/a',
        imagen_url: document.getElementById('imagen_url').value,
    };

    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing ? `${API_URL}/${productId}` : API_URL;

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(productData)
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message);
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('productModal'));
            modal.hide();
            // Recargar la tabla
            loadProducts(); 
        } else {
            alert(`Error ${isEditing ? 'al actualizar' : 'al crear'}: ${data.message || 'Error desconocido'}`);
        }

    } catch (error) {
        console.error('Error de red/servidor:', error);
        alert('Error de conexión con el servidor.');
    }
});

function attachEventListeners() {
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            clearForm();
            const id = e.target.dataset.id;
            document.getElementById('productModalLabel').textContent = 'Editar Producto';

            const token = getToken();
            try {
                // Obtener datos del producto para cargar el formulario
                const response = await fetch(`${API_URL}/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const product = await response.json();

                if (response.ok) {
                    document.getElementById('product-id').value = product._id;
                    document.getElementById('nombre').value = product.nombre;
                    document.getElementById('descripcion').value = product.descripcion;
                    document.getElementById('precio').value = product.precio;
                    document.getElementById('stock').value = product.stock;
                    document.getElementById('tipo').value = product.tipo;
                    document.getElementById('variedad').value = product.variedad;
                    document.getElementById('imagen_url').value = product.imagen_url;
                } else {
                    alert('Producto no encontrado.');
                }
            } catch (error) {
                console.error('Error al cargar datos de edición:', error);
            }
        });
    });

    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const id = e.target.dataset.id;
            if (confirm('¿Está seguro de que desea eliminar este producto?')) {
                const token = getToken();
                try {
                    const response = await fetch(`${API_URL}/${id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    const data = await response.json();

                    if (response.ok) {
                        alert(data.message);
                        loadProducts(); 
                    } else {
                        alert(`Error al eliminar: ${data.message}`);
                    }
                } catch (error) {
                    console.error('Error de red/servidor al eliminar:', error);
                }
            }
        });
    });
}

document.getElementById('add-product-btn').addEventListener('click', clearForm);

document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('userToken');
    alert('Sesión cerrada.');
    window.location.href = 'login.html';
});

document.addEventListener('DOMContentLoaded', loadProducts);
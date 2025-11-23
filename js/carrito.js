document.addEventListener('DOMContentLoaded', () => {
    cargarCarrito();
    document.getElementById('checkout-btn').addEventListener('click', handleCheckoutRedirect);
    document.getElementById('return-to-store-btn').addEventListener('click', () => {
        window.location.href = 'catalog.html';
    });
});

function getToken() {
    return localStorage.getItem('userToken');
}

function handleCheckoutRedirect() {
    const token = getToken();
    if (!token) {
        alert('Debes iniciar sesión para continuar al pago.');
        window.location.href = 'login.html';
        return;
    }
    
    window.location.href = 'despacho.html';
}

async function cargarCarrito() {
    const token = getToken();
    const cartItemsElement = document.getElementById('cart-items');
    const emptyMessageElement = document.getElementById('empty-cart-message');
    const totalElement = document.getElementById('cart-total');
    
    if (!token) {
        cartItemsElement.innerHTML = '';
        emptyMessageElement.style.display = 'block';
        totalElement.textContent = '$0 CLP';
        return;
    }
    
    cartItemsElement.innerHTML = '';
    
    try {
        const response = await fetch('/api/carrito', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const items = await response.json();
        let total = 0;

        if (items.length === 0) {
            emptyMessageElement.style.display = 'block';
            document.querySelector('.cart-actions').style.display = 'none';
        } else {
            emptyMessageElement.style.display = 'none';
            document.querySelector('.cart-actions').style.display = 'flex';
            
            items.forEach(item => {
                const subtotal = item.cantidad * item.precio_unitario;
                total += subtotal;
                
                const li = document.createElement('li');
                li.className = 'cart-item';
                li.innerHTML = `
                    <img src="${item.producto_id.imagen_url || 'img/default.webp'}" class="product-img me-3" alt="${item.nombre_producto}">
                    <div class="item-details">
                        <h3>${item.nombre_producto}</h3>
                        <p>Precio: $${item.precio_unitario.toLocaleString('es-CL')} CLP</p>
                        <div class="quantity-control">
                            <button class="decrease-btn" data-id="${item._id}" data-cantidad="${item.cantidad}">-</button>
                            <span class="item-quantity">${item.cantidad}</span>
                            <button class="increase-btn" data-id="${item._id}" data-cantidad="${item.cantidad}">+</button>
                        </div>
                    </div>
                    <button class="remove-item" data-id="${item._id}">Eliminar</button>
                `;
                
                cartItemsElement.appendChild(li);
            });
        }
        
        totalElement.textContent = `$${total.toLocaleString('es-CL')} CLP`;
        
        cartItemsElement.querySelectorAll('.increase-btn').forEach(btn => btn.addEventListener('click', (e) => actualizarCantidad(e.target.dataset.id, parseInt(e.target.dataset.cantidad) + 1)));
        cartItemsElement.querySelectorAll('.decrease-btn').forEach(btn => btn.addEventListener('click', (e) => actualizarCantidad(e.target.dataset.id, parseInt(e.target.dataset.cantidad) - 1)));
        cartItemsElement.querySelectorAll('.remove-item').forEach(btn => btn.addEventListener('click', (e) => eliminarItem(e.target.dataset.id)));

    } catch (error) {
        console.error('Error al cargar el carrito:', error);
        cartItemsElement.innerHTML = '<p class="text-danger">Error al cargar el carrito. Intenta iniciar sesión nuevamente.</p>';
    }
}

async function actualizarCantidad(itemId, nuevaCantidad) {
    const token = getToken();

    if (nuevaCantidad < 1) {
        if (confirm('¿Deseas eliminar este producto del carrito?')) {
            eliminarItem(itemId);
        }
        return;
    }

    try {
        const response = await fetch(`/api/carrito/${itemId}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ cantidad: nuevaCantidad })
        });
        
        if (response.ok) {
            cargarCarrito(); 
        } else {
            const data = await response.json();
            alert('Error al actualizar: ' + (data.message || 'Error desconocido.'));
        }

    } catch (error) {
        console.error('Error al actualizar cantidad:', error);
    }
}

async function eliminarItem(itemId) {
    const token = getToken();
    
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) return;

    try {
        const response = await fetch(`/api/carrito/${itemId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            cargarCarrito(); 
        } else {
            const data = await response.json();
            alert('Error al eliminar: ' + (data.message || 'Error desconocido.'));
        }
    } catch (error) {
        console.error('Error al eliminar ítem:', error);
    }
}
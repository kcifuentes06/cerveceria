document.addEventListener('DOMContentLoaded', () => {
    
    const userName = localStorage.getItem('userName');
    const userToken = localStorage.getItem('userToken');

    if (!userToken) {
        alert('Debes iniciar sesión para acceder a tu perfil.');
        window.location.href = 'login.html';
        return;
    }

    const welcomeMessage = document.getElementById('welcome-message');
    const userNameSpan = document.getElementById('user-name');
    
    if (userName) {
        welcomeMessage.textContent = `Bienvenido, ${userName}`;
        userNameSpan.textContent = userName;
    } else {
        welcomeMessage.textContent = 'Mi Perfil';
        userNameSpan.textContent = 'Usuario Desconocido';
    }

    const logoutBtn = document.getElementById('logout-btn');
    const navLogoutLink = document.getElementById('nav-logout');
    
    const handleLogout = (event) => {
        event.preventDefault();
        localStorage.removeItem('userToken');
        localStorage.removeItem('userName');
        alert('Sesión cerrada exitosamente.');
        window.location.href = 'catalog.html';
    };

    logoutBtn.addEventListener('click', handleLogout);
    navLogoutLink.addEventListener('click', handleLogout);

    fetchOrderHistory(userToken);
});

async function fetchOrderHistory(token) {
    const historialContainer = document.getElementById('historial-pedidos');
    const loadingMessage = document.getElementById('loading-message');
    
    try {
        const response = await fetch('/api/pedidos/usuario/historial', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}` 
            }
        });

        const data = await response.json();
        
        loadingMessage.style.display = 'none';

        if (response.ok) {
            if (data.pedidos && data.pedidos.length === 0) {
                historialContainer.innerHTML = '<p class="text-center">No has realizado ningún pedido todavía. ¡Echa un vistazo a nuestro <a href="catalog.html">catálogo</a>!</p>';
            } else if (data.length > 0) {
                renderOrders(data, historialContainer);
            } else {
                historialContainer.innerHTML = '<p class="text-center">No has realizado ningún pedido todavía. ¡Echa un vistazo a nuestro <a href="catalog.html">catálogo</a>!</p>';
            }
        } else {
            
            historialContainer.innerHTML = `<p class="text-danger">Error al cargar pedidos: ${data.message || 'Error desconocido'}</p>`;
            if (response.status === 401) {
                
                localStorage.removeItem('userToken');
                localStorage.removeItem('userName');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1000);
            }
        }

    } catch (error) {
        console.error('Error de red al cargar historial:', error);
        historialContainer.innerHTML = '<p class="text-danger">Error de conexión con el servidor.</p>';
    }
}


function renderOrders(pedidos, container) {
    container.innerHTML = ''; 

    pedidos.forEach(pedido => {
        const pedidoCard = document.createElement('div');
        pedidoCard.className = 'pedido-card';

        
        const estadoDisplay = {
            'PENDIENTE_PAGO': 'Pendiente de Pago',
            'PAGADO': 'Pagado',
            'ENVIADO': 'Enviado',
            'ENTREGADO': 'Entregado',
            'CANCELADO': 'Cancelado'
        };
        
        
        const totalFormateado = pedido.total_pedido.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });

        pedidoCard.innerHTML = `
            <div class="pedido-header d-flex justify-content-between align-items-center mb-2">
                <h5>Pedido N°: ${pedido._id.substring(0, 8)}...</h5>
                <span class="pedido-estado estado-${pedido.estado}">${estadoDisplay[pedido.estado]}</span>
            </div>
            <p class="mb-1"><strong>Fecha:</strong> ${pedido.fecha_formateada}</p>
            <p><strong>Total:</strong> ${totalFormateado}</p>

            <h6>Detalle de Productos:</h6>
            <ul class="list-unstyled">
                ${pedido.detalles.map(item => `
                    <li class="detalle-item">
                        ${item.cantidad} x ${item.nombre_producto} (${(item.precio_pagado * item.cantidad).toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })})
                    </li>
                `).join('')}
            </ul>

            <h6 class="mt-2">Dirección de Despacho:</h6>
            <p class="detalle-item">${pedido.direccion.calle} #${pedido.direccion.numero}, ${pedido.direccion.comuna}, ${pedido.direccion.region}</p>
        `;
        
        container.appendChild(pedidoCard);
    });
}
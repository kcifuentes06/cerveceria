document.addEventListener('DOMContentLoaded', () => {
    loadPaymentSummary();
});

function getToken() {
    return localStorage.getItem('userToken');
}

function getUrlParams() {
    const params = {};
    window.location.search.substring(1).split('&').forEach(pair => {
        const [key, value] = pair.split('=');
        params[key] = decodeURIComponent(value);
    });
    return params;
}

async function loadPaymentSummary() {
    const params = getUrlParams();
    const orderId = params['id'];
    const status = params['status'];
    const token = getToken();

    const summaryCard = document.getElementById('summary-card');
    const loadingMessage = document.getElementById('loading-message');
    const content = document.getElementById('content');
    
    
    loadingMessage.style.display = 'block';
    content.style.display = 'none';

    if (!orderId || !token) {
        summaryCard.innerHTML = '<p class="text-danger">Error: Falta el ID del pedido o no has iniciado sesión.</p>';
        return;
    }
    
    
    try {
        const response = await fetch(`/api/pedidos/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const orderDetails = await response.json();
        
        if (!response.ok) {
            throw new Error(orderDetails.message || 'Error al cargar detalles del pedido.');
        }

        
        renderSummary(status, orderDetails);

    } catch (error) {
        console.error("Error al cargar resumen:", error);
        summaryCard.innerHTML = `<p class="text-danger">No se pudo cargar el resumen del pedido. ${error.message}</p>`;
    }
}

function renderSummary(status, orderDetails) {
    const summaryCard = document.getElementById('summary-card');
    const statusTitle = document.getElementById('status-title');
    const statusMessage = document.getElementById('status-message');
    const orderTotal = document.getElementById('order-total');
    const orderIdDisplay = document.getElementById('order-id-display');
    
    const statusMap = {
        'success': { title: '¡Pago Aprobado!', class: 'success', msg: 'Tu pedido ha sido confirmado. Recibirás la boleta digital pronto.' },
        'pending': { title: 'Pago Pendiente', class: 'pending', msg: 'Estamos esperando la confirmación de tu banco. Revisa tu correo.' },
        'failure': { title: 'Pago Rechazado', class: 'failure', msg: 'El pago no se pudo completar. Intenta con otro medio de pago.' }
    };
    
    const result = statusMap[status] || statusMap['failure'];
    
    
    summaryCard.className += ' ' + result.class;
    statusTitle.textContent = result.title;
    statusMessage.textContent = result.msg;
    
    
    orderTotal.textContent = `$${orderDetails.total_pedido.toLocaleString('es-CL')} CLP`;
    orderIdDisplay.textContent = `Referencia de Pedido: ${orderDetails._id}`;

    document.getElementById('loading-message').style.display = 'none';
    document.getElementById('content').style.display = 'block';
}
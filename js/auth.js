document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

async function handleLogin(event) {
    event.preventDefault(); 

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const mensajeError = document.getElementById('mensaje-error');

    mensajeError.textContent = '';

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('userToken', data.token); 
            localStorage.setItem('userName', data.usuario.nombre); 
            window.location.href = 'catalog.html'; 
        } else {
            mensajeError.textContent = data.message || 'Error desconocido al iniciar sesión.';
        }

    } catch (error) {
        console.error('Error de red o servidor:', error);
        mensajeError.textContent = 'No se pudo conectar con el servidor.';
    }
}
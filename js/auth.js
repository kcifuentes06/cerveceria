document.addEventListener('DOMContentLoaded', () => {
    
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
});

function getToken() {
    return localStorage.getItem('userToken');
}

async function handleLogin(event) {
    event.preventDefault(); 

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const mensajeError = document.getElementById('mensaje-error');

    mensajeError.textContent = '';
    mensajeError.style.color = 'red';

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

async function handleRegister(event) {
    event.preventDefault();

    const nombre = document.getElementById('nombre').value;
    const rut = document.getElementById('rut').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    const feedback = document.getElementById('mensaje-feedback');
    feedback.textContent = '';

    
    if (password.length < 6) {
        feedback.textContent = 'La contraseña debe tener al menos 6 caracteres.';
        feedback.style.color = 'red';
        return;
    }

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ nombre, rut, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            
            localStorage.setItem('userToken', data.token);
            localStorage.setItem('userName', nombre); 
            
            feedback.textContent = '¡Registro exitoso! Redirigiendo...';
            feedback.style.color = 'green';
            
            
            setTimeout(() => {
                window.location.href = 'catalog.html';
            }, 1500);
            
        } else {
            
            feedback.textContent = data.message || 'Error desconocido en el registro.';
            feedback.style.color = 'red';
        }

    } catch (error) {
        console.error('Error de red o servidor:', error);
        feedback.textContent = 'No se pudo conectar con el servidor.';
        feedback.style.color = 'red';
    }
}
document.addEventListener('DOMContentLoaded', () => {

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }


    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    

    updateNavbarLinks();
});


async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const form = event.target;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {

            localStorage.setItem('userToken', data.token);

            localStorage.setItem('userName', data.usuario.nombre); 
            
            alert('Inicio de sesión exitoso. Bienvenido ' + data.usuario.nombre);
            

            window.location.href = 'catalog.html'; 
        } else {
            alert(data.message || 'Error al iniciar sesión.');
        }
    } catch (error) {
        console.error('Error de red/servidor:', error);
        alert('No se pudo conectar al servidor.');
    }
}


async function handleRegister(event) {
    event.preventDefault();
    const nombre = document.getElementById('nombre').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const form = event.target;

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Cuenta creada con éxito. Por favor, inicia sesión.');
            window.location.href = 'login.html';
        } else {
            alert(data.message || 'Error al crear la cuenta.');
        }
    } catch (error) {
        console.error('Error de red/servidor:', error);
        alert('No se pudo conectar al servidor.');
    }
}


function updateNavbarLinks() {
    const token = localStorage.getItem('userToken');
    const userName = localStorage.getItem('userName');
    

    const adminLinkContainer = document.getElementById('admin-link-container');
    const myAccountLink = document.getElementById('my-account-link');
    const logoutLinkContainer = document.getElementById('logout-link-container');

    if (token) {

        if (adminLinkContainer) {
            adminLinkContainer.style.display = 'block';
        }
        if (logoutLinkContainer) {
            logoutLinkContainer.style.display = 'block';
        }
        

        if (myAccountLink) {
            myAccountLink.href = 'mi_cuenta.html'; 
            myAccountLink.textContent = userName ? `Hola, ${userName}` : 'Mi Perfil';
        }

    } else {

        if (adminLinkContainer) {
            adminLinkContainer.style.display = 'none';
        }
        if (logoutLinkContainer) {
            logoutLinkContainer.style.display = 'none';
        }
        

        if (myAccountLink) {
            myAccountLink.href = 'login.html';
            myAccountLink.textContent = 'Mi Cuenta';
        }
    }
}


function handleLogout(e) {
    e.preventDefault();
    localStorage.removeItem('userToken');
    localStorage.removeItem('userName');
    alert('Sesión cerrada.');

    updateNavbarLinks(); 

    window.location.href = 'catalog.html';
}

document.addEventListener('DOMContentLoaded', updateNavbarLinks);
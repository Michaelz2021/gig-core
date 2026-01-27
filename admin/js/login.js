// Get API base URL - use relative path for same origin, or absolute URL if needed
const API_BASE_URL = window.location.origin + '/api/v1';

// Password toggle
document.getElementById('togglePassword').addEventListener('click', function() {
    const passwordInput = document.getElementById('password');
    const eyeIcon = this.querySelector('.eye-icon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.textContent = '🙈';
    } else {
        passwordInput.type = 'password';
        eyeIcon.textContent = '👁️';
    }
});

// Login form submission
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const loginButton = document.getElementById('loginButton');
    const buttonText = loginButton.querySelector('.button-text');
    const buttonLoader = loginButton.querySelector('.button-loader');
    const errorMessage = document.getElementById('errorMessage');
    
    // Show loading state
    loginButton.disabled = true;
    buttonText.style.display = 'none';
    buttonLoader.style.display = 'inline';
    errorMessage.style.display = 'none';
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || '로그인에 실패했습니다.');
        }
        
        // Check if admin user
        if (data.user && data.user.email === 'admin@example.com') {
            // Store token and user info
            localStorage.setItem('adminToken', data.accessToken);
            localStorage.setItem('adminUser', JSON.stringify(data.user));
            
            // Redirect to dashboard
            window.location.href = '/admin/dashboard.html';
        } else {
            throw new Error('관리자 계정만 접근할 수 있습니다.');
        }
    } catch (error) {
        errorMessage.textContent = error.message;
        errorMessage.style.display = 'block';
    } finally {
        // Reset button state
        loginButton.disabled = false;
        buttonText.style.display = 'inline';
        buttonLoader.style.display = 'none';
    }
});

// Check if already logged in
window.addEventListener('DOMContentLoaded', function() {
    const adminToken = localStorage.getItem('adminToken');
    const adminUser = localStorage.getItem('adminUser');
    
    if (adminToken && adminUser) {
        try {
            const user = JSON.parse(adminUser);
            if (user.email === 'admin@example.com') {
                window.location.href = '/admin/dashboard.html';
            }
        } catch (e) {
            // Invalid stored data, clear it
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
        }
    }
});


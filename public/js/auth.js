// Handle login form submission
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');
    
    try {
      const response = await fetch('/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        window.location.href = data.redirect;
      } else {
        errorMessage.textContent = data.error;
        errorMessage.classList.remove('hidden');
      }
    } catch (error) {
      errorMessage.textContent = 'An error occurred. Please try again.';
      errorMessage.classList.remove('hidden');
      console.error('Login error:', error);
    }
  });
  
  // Handle signup form submission
  document.getElementById('signupForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    
    // Clear messages
    errorMessage.classList.add('hidden');
    successMessage.classList.add('hidden');
    
    // Validate passwords match
    if (password !== confirmPassword) {
      errorMessage.textContent = 'Passwords do not match';
      errorMessage.classList.remove('hidden');
      return;
    }
    
    try {
      const response = await fetch('/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        successMessage.textContent = data.message;
        successMessage.classList.remove('hidden');
        // Redirect to login after 2 seconds
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        errorMessage.textContent = data.error;
        errorMessage.classList.remove('hidden');
      }
    } catch (error) {
      errorMessage.textContent = 'An error occurred. Please try again.';
      errorMessage.classList.remove('hidden');
      console.error('Signup error:', error);
    }
  });
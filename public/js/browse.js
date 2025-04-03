document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Fetch gigs from API
    const response = await fetch('/api/gigs');
    if (!response.ok) throw new Error('Failed to load gigs');
    
    const gigs = await response.json();
    const gigsList = document.getElementById('gigsList');
    
    // Clear previous content
    gigsList.innerHTML = '';

    // Handle empty gigs case
    if (gigs.length === 0) {
      gigsList.innerHTML = '<p class="text-gray-500 py-4">No available gigs at the moment. Check back later!</p>';
      return;
    }

    // Render gigs
    gigs.forEach(gig => {
      const gigElement = document.createElement('div');
      gigElement.className = 'bg-white rounded-lg shadow-md p-6 mb-4';
      gigElement.innerHTML = `
        <h3 class="text-xl font-semibold mb-2">${gig.title || 'Untitled Gig'}</h3>
        <p class="text-gray-600 mb-4">${gig.description || 'No description provided'}</p>
        <div class="flex justify-between items-center">

<span class="font-medium">
  ${gig.amount > 0 ? '$' + (gig.amount / 100).toFixed(2) : 'Price negotiable'}
</span>
          <button 
            data-gig-id="${gig.id}" 
            class="applyBtn bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Apply
          </button>
        </div>
      `;
      gigsList.appendChild(gigElement);
    });

    // Handle apply buttons
   // Replace your current apply button handler with this:
   // Add this error display element first
document.body.insertAdjacentHTML('beforeend', `
  <div id="error-toast" class="fixed bottom-4 right-4 hidden bg-red-500 text-white px-4 py-2 rounded"></div>
`);
document.querySelectorAll('.applyBtn').forEach(button => {
  button.addEventListener('click', async (e) => {
    const gigId = e.target.dataset.gigId;
    const button = e.target;
    
    // Disable button during request
    button.disabled = true;
    button.textContent = "Applying...";

    try {
      const response = await fetch('/api/apply-gig', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ gigId })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Application failed");
      }

      // Success feedback
      button.textContent = "✓ Applied";
      button.classList.remove('bg-indigo-600');
      button.classList.add('bg-green-500');
      alert("Application submitted!");
      
    } catch (error) {
      console.error("Apply error:", error);
      button.textContent = "Retry";
      alert(`Error: ${error.message}`);
    } finally {
      setTimeout(() => {
        button.disabled = false;
        button.textContent = "Apply";
        button.classList.add('bg-indigo-600');
        button.classList.remove('bg-green-500');
      }, 3000);
    }
  });
});

  } catch (error) {
    console.error('Error loading gigs:', error);
    document.getElementById('gigsList').innerHTML = `
      <p class="text-red-500 py-4">Error: ${error.message}</p>
    `;
  }
});
button.addEventListener('click', async (e) => {
  const button = e.target;
  button.disabled = true;
  button.textContent = "Applying...";

  try {
    // In your apply button handler
const token = await firebase.auth().currentUser?.getIdToken();
const response = await fetch('/api/apply-gig', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}` // Use Firebase Web SDK token
  },
  body: JSON.stringify({ gigId })
});

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || "Application failed");
    }

    // Success
    button.textContent = "✓ Applied";
    button.classList.replace('bg-indigo-600', 'bg-green-500');
    
  } catch (error) {
    console.error(error);
    button.textContent = "Apply";
    showErrorToast(error.message); // Implement this function
  } finally {
    button.disabled = false;
  }
});
// Optional: Add this if you want manual refresh capability
// async function loadGigs() { /* ... same fetch logic as above ... */}
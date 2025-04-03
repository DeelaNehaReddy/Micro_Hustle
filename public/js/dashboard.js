document.addEventListener('DOMContentLoaded', () => {
  // New Gig Modal
  const newGigBtn = document.getElementById('newGigBtn');
  const newGigModal = document.getElementById('newGigModal');
  const cancelGig = document.getElementById('cancelGig');
  const newGigForm = document.getElementById('newGigForm');

  if (newGigBtn) {
    newGigBtn.addEventListener('click', () => {
      newGigModal.classList.remove('hidden');
    });
  }

  if (cancelGig) {
    cancelGig.addEventListener('click', () => {
      newGigModal.classList.add('hidden');
    });
  }

  if (newGigForm) {
    newGigForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const title = document.getElementById('gigTitle').value;
      const description = document.getElementById('gigDescription').value;
      const amount = document.getElementById('gigAmount').value;

      try {
        const response = await fetch('/api/create-gig', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ title, description, amount })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create gig');
        }

        // Close modal and refresh
        newGigModal.classList.add('hidden');
        window.location.reload();
      } catch (error) {
        console.error('Gig creation error:', error);
        alert(error.message);
        
        // Show error in modal
        const errorElement = document.createElement('p');
        errorElement.className = 'text-red-500 text-sm mt-2';
        errorElement.textContent = error.message;
        newGigForm.appendChild(errorElement);
        
        // Remove error after 3 seconds
        setTimeout(() => {
          errorElement.remove();
        }, 3000);
      }
    });
  }
});
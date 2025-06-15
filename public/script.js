document.addEventListener('DOMContentLoaded', () => {
    const photoUpload = document.getElementById('photo-upload');
    const previewImage = document.getElementById('preview-image');
    const previewContainer = document.getElementById('preview-container');
    const dressItems = document.querySelectorAll('.dress-item');
    const tryOnButton = document.getElementById('try-on-button');
    const resultImage = document.getElementById('result-image');

    let selectedDress = null;
    let uploadedPhoto = null;
    let jobId = null;

    // Handle photo upload
    photoUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImage.src = e.target.result;
                previewImage.style.display = 'block';
                uploadedPhoto = e.target.result;
                updateTryOnButton();
            };
            reader.readAsDataURL(file);
        }
    });

    // Handle dress selection
    dressItems.forEach(item => {
        item.addEventListener('click', () => {
            dressItems.forEach(d => d.classList.remove('selected'));
            item.classList.add('selected');
            selectedDress = item.dataset.dress;
            updateTryOnButton();
        });
    });

    // Update try-on button state
    function updateTryOnButton() {
        tryOnButton.disabled = !(uploadedPhoto && selectedDress);
    }

    // Check job status
    async function checkJobStatus(jobId) {
        try {
            console.log('Checking job status for:', jobId);
            const response = await fetch(`/api/status/${jobId}`);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Job status check failed:', response.status, errorText);
                throw new Error(`Failed to check job status: ${response.status} ${errorText}`);
            }

            const data = await response.json();
            console.log('Job status response:', data);
            return data;
        } catch (error) {
            console.error('Error checking job status:', error);
            throw error;
        }
    }

    // Poll job status
    async function pollJobStatus(jobId) {
        const maxAttempts = 30; // 5 minutes with 10-second intervals
        let attempts = 0;

        const poll = async () => {
            try {
                const status = await checkJobStatus(jobId);
                
                if (status.status === 'completed') {
                    resultImage.innerHTML = `<img src="${status.result_url}" alt="Virtual Try-On Result">`;
                    return;
                } else if (status.status === 'failed') {
                    throw new Error('Job failed');
                }

                attempts++;
                if (attempts < maxAttempts) {
                    setTimeout(poll, 10000); // Poll every 10 seconds
                } else {
                    throw new Error('Job timeout');
                }
            } catch (error) {
                resultImage.innerHTML = '<p>Error generating try-on. Please try again.</p>';
                console.error('Error:', error);
            }
        };

        poll();
    }

    // Handle try-on button click
    tryOnButton.addEventListener('click', async () => {
        if (!uploadedPhoto || !selectedDress) return;

        try {
            tryOnButton.disabled = true;
            resultImage.innerHTML = '<p>Generating your virtual try-on...</p>';

            // Fetch dress image with cache-busting
            let dressImage;
            try {
                const timestamp = new Date().getTime();
                const dressResponse = await fetch(`images/${selectedDress}.jpg?t=${timestamp}`);
                if (!dressResponse.ok) {
                    throw new Error(`Failed to load dress image: ${dressResponse.status}`);
                }
                dressImage = await dressResponse.blob();
            } catch (error) {
                console.error('Error loading dress image:', error);
                throw new Error('Failed to load dress image');
            }

            // Send request to our server
            const response = await fetch('/api/try-on', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    image_model_file: uploadedPhoto,
                    image_garment_file: await blobToBase64(dressImage)
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API request failed:', response.status, errorText);
                throw new Error(`API request failed: ${response.status} ${errorText}`);
            }

            const data = await response.json();
            console.log('API response:', data);

            if (data.status === 'initiated') {
                jobId = data.job_id;
                await pollJobStatus(jobId);
            } else {
                throw new Error(`Invalid response status: ${data.status}`);
            }
        } catch (error) {
            resultImage.innerHTML = '<p>Error generating try-on. Please try again.</p>';
            console.error('Error:', error);
        } finally {
            tryOnButton.disabled = false;
        }
    });

    // Helper function to convert Blob to base64
    function blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
}); 
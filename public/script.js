document.addEventListener('DOMContentLoaded', () => {
    const photoUpload = document.getElementById('photo-upload');
    const previewImage = document.getElementById('preview-image');
    const previewContainer = document.getElementById('preview-container');
    const dressItems = document.querySelectorAll('.dress-item');
    const tryOnButton = document.getElementById('try-on-button');
    const resultImage = document.getElementById('result-image');
    const modelType = document.getElementById('model-type');
    const garmentType = document.getElementById('garment-type');
    const repaintHands = document.getElementById('repaint-hands');
    const repaintFeet = document.getElementById('repaint-feet');
    const repaintOther = document.getElementById('repaint-other');

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
                console.log('Job status response:', status);
                
                if (status.status === 'completed') {
                    if (status.output && status.output[0] && status.output[0].image_url) {
                        resultImage.innerHTML = `<img src="${status.output[0].image_url}" alt="Virtual Try-On Result">`;
                    } else {
                        throw new Error('No image URL in response');
                    }
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
                resultImage.innerHTML = `<p>Error: ${error.message}</p>`;
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
                console.log('Fetching dress image:', selectedDress);
                const dressResponse = await fetch(`images/${selectedDress}.JPG?t=${timestamp}`);
                if (!dressResponse.ok) {
                    throw new Error(`Failed to load dress image: ${dressResponse.status}`);
                }
                dressImage = await dressResponse.blob();
                console.log('Dress image loaded successfully');
            } catch (error) {
                console.error('Error loading dress image:', error);
                throw new Error('Failed to load dress image');
            }

            // Convert images to base64
            const modelBase64 = uploadedPhoto;
            const dressBase64 = await blobToBase64(dressImage);
            
            console.log('Model image length:', modelBase64.length);
            console.log('Dress image length:', dressBase64.length);

            // Get parameter values
            const parameters = {
                model_type: modelType.value,
                garment_type: garmentType.value,
                repaint_hands: repaintHands.checked.toString(),
                repaint_feet: repaintFeet.checked.toString(),
                repaint_other_garment: repaintOther.checked.toString()
            };

            // Send request to our server
            console.log('Sending try-on request to server...');
            const response = await fetch('/api/try-on', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    image_model_file: modelBase64,
                    image_garment_file: dressBase64,
                    ...parameters
                })
            });

            console.log('Server response status:', response.status);
            const responseText = await response.text();
            console.log('Server response text:', responseText);

            let data;
            try {
                data = JSON.parse(responseText);
                console.log('Parsed server response:', data);
            } catch (error) {
                console.error('Error parsing server response:', error);
                throw new Error('Invalid server response format');
            }

            if (!response.ok) {
                throw new Error(`API request failed: ${data.error || response.status} ${data.details || ''}`);
            }

            if (data.status === 'initiated' && data.job_id) {
                console.log('Try-on initiated with job ID:', data.job_id);
                jobId = data.job_id;
                await pollJobStatus(jobId);
            } else {
                console.error('Invalid response data:', data);
                throw new Error(`Invalid response: ${JSON.stringify(data)}`);
            }
        } catch (error) {
            console.error('Error in try-on process:', error);
            resultImage.innerHTML = `<p>Error: ${error.message}</p>`;
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
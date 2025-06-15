require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const FormData = require('form-data');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Proxy endpoint for try-on
app.post('/api/try-on', async (req, res) => {
    try {
        console.log('Received try-on request');
        const formData = new FormData();
        
        // Convert base64 to buffer and append to form data
        const modelImageBuffer = Buffer.from(req.body.image_model_file.split(',')[1], 'base64');
        formData.append('image_model_file', modelImageBuffer, {
            filename: 'model.jpg',
            contentType: 'image/jpeg'
        });

        // Convert garment image from base64 to buffer
        const garmentImageBuffer = Buffer.from(req.body.image_garment_file.split(',')[1], 'base64');
        formData.append('image_garment_file', garmentImageBuffer, {
            filename: 'garment.jpg',
            contentType: 'image/jpeg'
        });

        // Append other form fields
        formData.append('garment_type', 'Full body');
        formData.append('model_type', 'HD');
        formData.append('repaint_hands', 'true');
        formData.append('repaint_feet', 'true');

        console.log('Sending request to HuHu AI API...');
        console.log('API Endpoint:', process.env.HUHU_API_ENDPOINT);
        console.log('API Key exists:', !!process.env.HUHU_API_KEY);
        
        // Make request to HuHu AI API
        const response = await fetch('https://api-service.huhu.ai/tryon/v1', {
            method: 'POST',
            headers: {
                'x-api-key': process.env.HUHU_API_KEY
            },
            body: formData
        });

        console.log('API Response Status:', response.status);
        console.log('API Response Headers:', response.headers);

        const responseText = await response.text();
        console.log('Raw API Response:', responseText);

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (error) {
            console.error('Error parsing API response:', error);
            return res.status(500).json({
                error: 'Invalid API response format',
                details: responseText
            });
        }

        console.log('HuHu AI API response:', JSON.stringify(data, null, 2));

        // Check if the response has the expected structure
        if (!data || !data.job_id) {
            console.error('Invalid API response structure:', data);
            return res.status(500).json({ 
                error: 'Invalid API response',
                details: data 
            });
        }

        // Return a standardized response
        const responseData = {
            status: 'initiated',
            job_id: data.job_id
        };
        console.log('Sending response to client:', responseData);
        res.json(responseData);
    } catch (error) {
        console.error('Error in try-on endpoint:', error);
        res.status(500).json({ 
            error: 'Failed to process try-on request',
            details: error.message 
        });
    }
});

// Proxy endpoint for checking job status
app.get('/api/status/:jobId', async (req, res) => {
    try {
        console.log('Checking status for job:', req.params.jobId);
        const response = await fetch(`https://api-service.huhu.ai/requests/v1?job_id=${req.params.jobId}`, {
            headers: {
                'x-api-key': process.env.HUHU_API_KEY
            }
        });

        const data = await response.json();
        console.log('Status response:', data);
        res.json(data);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to check job status' });
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
}); 
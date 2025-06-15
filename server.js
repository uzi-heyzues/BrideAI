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
app.use(express.static('public'));

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Proxy endpoint for try-on
app.post('/api/try-on', async (req, res) => {
    try {
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
        
        // Make request to HuHu AI API
        const response = await fetch(process.env.HUHU_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.HUHU_API_KEY}`
            },
            body: formData
        });

        const data = await response.json();
        console.log('HuHu AI API response:', data);
        res.json(data);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to process try-on request' });
    }
});

// Proxy endpoint for checking job status
app.get('/api/status/:jobId', async (req, res) => {
    try {
        console.log('Checking status for job:', req.params.jobId);
        const response = await fetch(`${process.env.HUHU_API_ENDPOINT}/requests/${req.params.jobId}`, {
            headers: {
                'Authorization': `Bearer ${process.env.HUHU_API_KEY}`
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

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 
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
        const { image_model_file, image_garment_file, model_type, garment_type, repaint_hands, repaint_feet, repaint_other_garment } = req.body;

        if (!image_model_file || !image_garment_file) {
            return res.status(400).json({ error: 'Missing required images' });
        }

        console.log('Received try-on request with parameters:', {
            model_type,
            garment_type,
            repaint_hands,
            repaint_feet,
            repaint_other_garment
        });

        const formData = new FormData();
        formData.append('image_model_file', image_model_file);
        formData.append('image_garment_file', image_garment_file);
        formData.append('model_type', model_type || 'full_body');
        formData.append('garment_type', garment_type || 'dress');
        formData.append('repaint_hands', repaint_hands || 'true');
        formData.append('repaint_feet', repaint_feet || 'true');
        formData.append('repaint_other_garment', repaint_other_garment || 'false');

        console.log('Sending request to HuHu AI API...');
        const response = await fetch('https://api.huhu.ai/v1/try-on', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.HUHU_API_KEY}`,
                ...formData.getHeaders()
            },
            body: formData
        });

        console.log('API Response status:', response.status);
        const data = await response.json();
        console.log('API Response data:', data);

        if (!response.ok) {
            throw new Error(`API request failed: ${data.error || response.status}`);
        }

        res.json(data);
    } catch (error) {
        console.error('Error in try-on endpoint:', error);
        res.status(500).json({ error: error.message });
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
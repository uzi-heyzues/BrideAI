# BrideAI - Virtual Wedding Dress Try-On

A web application that allows brides to virtually try on wedding dresses using AI technology.

## Features

- Photo upload functionality
- Gallery of wedding dresses
- Virtual try-on using HuHu AI API
- Responsive design
- Clean and elegant UI

## Local Development

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with your HuHu AI API key:
   ```
   HUHU_API_KEY=your_api_key_here
   HUHU_API_ENDPOINT=https://api.huhu.ai/v1/try-on
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open http://localhost:3000 in your browser

## Deployment

This application is configured for deployment on Render.com:

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Use the following settings:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment Variables:
     - `HUHU_API_KEY`: Your HuHu AI API key
     - `HUHU_API_ENDPOINT`: https://api.huhu.ai/v1/try-on

## Project Structure

```
brideai/
├── public/              # Static files
│   ├── images/         # Dress images
│   ├── index.html      # Main HTML file
│   ├── styles.css      # CSS styles
│   └── script.js       # Frontend JavaScript
├── server.js           # Node.js server
├── package.json        # Project dependencies
└── .env               # Environment variables (not in git)
```

## Technical Details

- Built with Node.js and Express
- Frontend: Vanilla HTML, CSS, and JavaScript
- Uses HuHu AI API for virtual try-on
- Responsive design for all devices

## Setup

1. Clone this repository
2. Add your wedding dress images to the `images` folder:
   - Name them `dress1.jpg`, `dress2.jpg`, `dress3.jpg`, and `dress4.jpg`
   - Recommended image size: 800x1200 pixels
   - Supported formats: JPG, PNG

3. Configure the HuHu AI API:
   - Open `script.js`
   - Replace `YOUR_HUHU_AI_API_ENDPOINT` with your actual API endpoint
   - Replace `YOUR_HUHU_AI_API_KEY` with your actual API key

4. Open `index.html` in a web browser to run the application

## Usage

1. Click "Choose Photo" to upload a photo of yourself
2. Select a wedding dress from the gallery
3. Click "Try On" to generate your virtual try-on
4. Wait for the AI to process and display the result

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Notes

- The application requires an active internet connection to communicate with the HuHu AI API
- For best results, use clear, well-lit photos
- The AI processing time may vary depending on server load and image complexity 
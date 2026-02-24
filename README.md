# Speech Practice AI

A web-based application that helps users improve their speaking skills through AI-powered feedback. The application records user speech, analyzes it using the Gemini AI API, and provides detailed feedback on pronunciation, pace, rhythm, and clarity.

## Features

- 🎤 Real-time speech recording with visual feedback
- 🤖 AI-powered speech analysis using Gemini API
- 📊 Detailed performance metrics and progress tracking
- 🎯 Multiple practice exercises with different texts
- 📈 Progress tracking and improvement statistics
- 🎧 Audio playback and download capabilities
- 📱 Responsive design for all devices

## Technologies Used

- HTML5
- CSS3
- JavaScript (ES6+)
- Web Audio API
- MediaRecorder API
- Gemini AI API

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- Microphone access
- Gemini API key

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
```

2. Open the project directory:
```bash
cd speech-practice-ai
```

3. Replace the Gemini API key in `script.js`:
```javascript
const GEMINI_API_KEY = 'YOUR_API_KEY_HERE';
```

4. Open `index.html` in your web browser or use a local server.

## Usage

1. Click "Start Recording" to begin your speech practice
2. Read the displayed text aloud
3. Click "Stop Recording" when finished
4. Wait for AI analysis
5. Review your feedback and accuracy score
6. Use "Repeat Exercise" to practice again or "New Exercise" to move on
7. Track your progress through the session

## Project Structure

- `index.html` - Main application interface
- `style.css` - Styling and layout
- `script.js` - Core functionality and AI integration

## Features in Detail

### Speech Recording
- Real-time audio level monitoring
- Speech detection and validation
- Audio quality checks

### AI Analysis
- Pronunciation accuracy assessment
- Pace and rhythm evaluation
- Natural intonation analysis
- Speech clarity feedback

### Progress Tracking
- Session progress bar
- Exercise completion tracking
- Average accuracy calculation
- Improvement percentage tracking

### User Interface
- Clean, modern design
- Responsive layout
- Visual feedback indicators
- Audio player integration

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- Gemini AI API for speech analysis capabilities
- Web Audio API for audio processing
- MediaRecorder API for recording functionality 
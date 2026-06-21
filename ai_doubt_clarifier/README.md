# AI Doubt Clarifier 🧠

A premium AI-powered educational web app built with Flask + Gemini.  
Students ask academic doubts and get structured, student-friendly explanations with:

- ✅ 4-part explanations (Definition → Simple → Example → Key Points)
- ✅ Confidence score with animated progress bar
- ✅ One-click quiz generator (3 MCQs)
- ✅ Learning dashboard with subject breakdown
- ✅ ChatGPT-style chat interface

---

## Setup

### 1. Get a Gemini API Key
Visit https://aistudio.google.com/app/apikey and create a free key.

### 2. Install dependencies
```bash
cd ai_doubt_clarifier
pip install -r requirements.txt
```

### 3. Set environment variable
```bash
# macOS / Linux
export GEMINI_API_KEY="your_key_here"

# Windows CMD
set GEMINI_API_KEY=your_key_here

# Windows PowerShell
$env:GEMINI_API_KEY="your_key_here"
```

Or create a `.env` file:
```
GEMINI_API_KEY=your_key_here
SECRET_KEY=any-random-string
```
Then add `from dotenv import load_dotenv; load_dotenv()` at the top of `app.py`.

### 4. Run the app
```bash
python app.py
```

Open http://localhost:5000 in your browser.

---

## Project Structure

```
ai_doubt_clarifier/
├── app.py                  # Flask backend + Gemini API integration
├── requirements.txt
├── templates/
│   ├── base.html           # Shared layout, navbar
│   ├── index.html          # Home page with hero + features
│   ├── ask.html            # Chat interface
│   └── dashboard.html      # Learning dashboard
└── static/
    ├── css/
    │   ├── main.css        # Design tokens, shared components
    │   ├── ask.css         # Chat page styles
    │   └── dashboard.css   # Dashboard styles
    └── js/
        ├── main.js         # Navbar, scroll reveal, shared utils
        ├── home.js         # Particle canvas animation
        ├── ask.js          # Chat logic, API calls, quiz modal
        └── dashboard.js    # Progress bar animations
```

## API Endpoints

| Method | Path           | Description                          |
|--------|----------------|--------------------------------------|
| GET    | `/`            | Home page                            |
| GET    | `/ask`         | Chat interface                       |
| GET    | `/dashboard`   | Learning dashboard                   |
| POST   | `/api/explain` | Get structured AI explanation        |
| POST   | `/api/quiz`    | Generate 3 MCQs from an explanation  |
| GET    | `/api/stats`   | Return current session stats as JSON |

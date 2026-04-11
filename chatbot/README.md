# AIKosh RAG Chatbot

Python backend for the AIKosh chatbot.

### Setup Chatbot (Terminal 1)
```bash
cd chatbot
python -m venv .venv
```

Activate the virtual environment:
```bash
# Windows
.venv\Scripts\activate

# Linux/Mac
source .venv/bin/activate
```

> **Why a virtual environment?** It keeps the chatbot's Python dependencies isolated from the rest of your system. This means installing packages here won't affect other Python projects on your machine, and you can always delete the `.venv` folder to start fresh without any side effects.

```bash
pip install -r requirements.txt
```

Create a `.env` file inside the `chatbot/` folder and add your Sarvam API key:
```bash
# chatbot/.env
SARVAM_API_KEY=your_actual_api_key_here
```

> **Important:** Without this `.env` file in the `chatbot/` directory, the chatbot will fail to start. Replace `your_actual_api_key_here` with the key you got from [Sarvam AI](https://www.sarvam.ai/).

```bash
python app.py
```

The chatbot API will run on `http://localhost:8000`
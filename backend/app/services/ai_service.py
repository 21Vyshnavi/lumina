import google.generativeai as genai
from typing import AsyncGenerator, List, Dict
import os

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

SYSTEM_PROMPT = """You are Lumina, a knowledgeable and helpful AI assistant.
You help users understand complex topics, summarize documents, and answer questions clearly.
Be conversational, accurate, and helpful. Format responses with markdown when it aids readability."""


async def stream_chat_response(
    messages: List[Dict[str, str]],
    system: str = SYSTEM_PROMPT,
) -> AsyncGenerator[str, None]:
    model = genai.GenerativeModel(MODEL, system_instruction=system)

    # Convert message format to Gemini format
    history = []
    for msg in messages[:-1]:
        history.append({
            "role": "user" if msg["role"] == "user" else "model",
            "parts": [msg["content"]]
        })

    chat = model.start_chat(history=history)
    last_message = messages[-1]["content"]

    response = chat.send_message(last_message, stream=True)
    for chunk in response:
        if chunk.text:
            yield chunk.text


def summarize_document(title: str, content: str) -> str:
    model = genai.GenerativeModel(MODEL)
    truncated = content[:8000]

    response = model.generate_content(
        f"Summarize this document titled '{title}' in 3-5 concise sentences focusing on key takeaways:\n\n{truncated}"
    )
    return response.text


def generate_chat_title(first_message: str) -> str:
    model = genai.GenerativeModel(MODEL)
    response = model.generate_content(
        f"Generate a very short 3-5 word chat title for this message. Return ONLY the title, no quotes:\n{first_message[:200]}"
    )
    return response.text.strip()


def chat_with_document_context(
    user_question: str,
    document_content: str,
    document_title: str,
    history: List[Dict[str, str]],
) -> str:
    system = (
        f"You are Lumina. The user is asking about a document titled '{document_title}'.\n\n"
        f"DOCUMENT:\n{document_content[:6000]}\n\n"
        "Answer based on the document. If the answer isn't there, say so."
    )
    model = genai.GenerativeModel(MODEL, system_instruction=system)
    response = model.generate_content(user_question)
    return response.text

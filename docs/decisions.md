# Decisions

Logged by `/grill`. Newest at the bottom. Read before asking a question that may already be settled.

## 2026-09-30 — KBC Travel Assistant demo
- **Idea:** the KBC app detects a booked trip from card transactions (flight/hotel MCCs), then offers travel insurance → confirm destination → travel budget → foreign currency → eSIM.
- **Data:** synthetic Belgian persona with real ISO 18245 MCC codes. Public datasets (Kaggle, Hugging Face) are US/USD and have no single-customer trip story.
- **AI:** rule-based detection (explainable, reliable on stage) + one OpenAI API call for a budget tip, with a canned fallback.
- **Format:** React web app in a phone frame, run on the presenter's laptop.
- **Destination:** outside the EU (New York), so FX and eSIM make sense (no euro, no free EU roaming).
- **Stack:** Vite 6, not 8. Vite 8 needs Node ≥ 20.19; team laptops run older Node 20.

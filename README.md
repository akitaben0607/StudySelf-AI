# StudySelf AI
### An Intelligent Personal Knowledge Workspace
**Your Knowledge, ORGANIZED.**

A 4-week college mini project: a personal AI-powered study workspace where
students organize learning into **Books** (folders) and **Topics**, chat
with an AI tutor inside each Topic, generate quizzes and flashcards from
their own content, and get an automatically prioritized **Revision Queue**
based on real quiz performance.

---

## Tech stack
Node.js · Express.js · EJS · MySQL · HTML/CSS/JavaScript · bcrypt · express-session

## 1. Install dependencies
```bash
npm install
```

## 2. Set up the database
Create the schema (creates the `studyself_ai` database and all tables):
```bash
mysql -u root -p < database/schema.sql
```

## 3. Configure environment variables
```bash
cp .env.example .env
```
Then edit `.env`:
- Set `DB_USER` / `DB_PASSWORD` to your MySQL credentials.
- Set `SESSION_SECRET` to any long random string.
- **AI_API_KEY is optional.** If you leave it blank, the app runs in
  **Demo Mode** automatically — every AI feature (chat, subheadings, quiz
  generation, flashcards, PDF topic analysis) returns clearly-labeled demo
  content so you can build and test the whole app before wiring up a real
  key. Add any OpenAI-compatible key + `AI_API_BASE_URL` + `AI_MODEL` later
  to switch on real AI responses — no code changes required.

## 4. Run the app
```bash
npm run dev     # with nodemon, auto-restarts on changes
# or
npm start
```
Visit **http://localhost:3000**.

---

## What's implemented
- **Auth**: register/login/logout, bcrypt password hashing, MySQL-backed
  sessions, protected routes, per-user data isolation on every query.
- **Books & Topics**: full CRUD, alphabetical sorting, auto-stamped creation
  year, confirmation before delete, cascading deletes (deleting a Book
  removes its Topics, chats, quizzes, and flashcards).
- **AI Chat**: per-Topic conversation history, stored in MySQL, loading/error
  states, demo-mode fallback.
- **Show Subheadings**: condenses a Topic's chat history into a heading
  outline for fast revision.
- **Take Quiz**: All Topics vs Specific Topic scope, question count
  (10/20/30/40/50), AI-generated multiple-choice questions, one-question-at-
  a-time UI with a progress bar and answer-required guard before submit.
- **Weakness Detection + Revision Queue**: rule-based analysis of quiz
  answers grouped by Topic; Topics scoring below 75% (with enough attempts
  to be meaningful) are queued with High/Medium/Low priority and a stated
  reason. "Mark as Revised" records the date and clears the item.
- **Flashcards**: AI-generated from a Topic's or Book's real chat content,
  flip/next/previous controls, Easy/Difficult rating stored per card.
- **PDF → Book**: upload validation (type + size), text extraction, AI topic
  identification, automatic Book + Topic creation, graceful failure handling
  for scanned/unreadable PDFs.
- **Study Map**: an SVG diagram built live from a Book's actual Topics (not
  a static image) — the center node is the Book, connected to each Topic.
- **Voice Study Mode**: browser Web Speech API for speech-to-text input and
  speech-synthesis for reading AI replies aloud; falls back to a clear
  message on unsupported browsers without breaking text chat.
- **Progress Dashboard**: real counts and quiz-derived strong/weak topic
  breakdowns — no placeholder numbers.
- **Global Search**: searches the user's own Books and Topics.
- Empty states, loading states, and flash messages throughout.

## Notes on scope
This was built to a realistic 4-week student-project scope: no Docker, no
microservices, no frontend framework — server-rendered EJS plus vanilla JS
for interactivity, as specified. The AI service (`services/aiService.js`)
is the single integration point for all AI calls, so swapping providers or
models only means editing one file, and the API key never reaches the
browser.

## Folder structure
```
config/        DB connection, session store
controllers/   Route handlers (one per feature area)
middleware/    Auth guards, file upload validation
models/        Parameterized MySQL queries, one file per table group
routes/        Express routers, mounted in app.js
services/      aiService.js — the only module that talks to the AI API
views/         EJS templates, mirroring the controllers
public/        CSS, client-side JS, static assets
database/      schema.sql
uploads/       Temporary PDF storage (deleted after processing)
```

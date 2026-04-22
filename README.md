# 🚀 Multi-Agent Orchestration System

A production-style **Multi-Agent System** where multiple specialized agents collaborate to process and answer complex natural language queries.

This system demonstrates **agent orchestration, task decomposition, and secure data separation** using real internal and external data sources.

---

## 🧠 System Architecture

The system is built around a **Supervisor-Orchestrator Pattern**.

### 🔹 Agents

#### 1. Supervisor Agent

* Main controller of the system
* Breaks user queries into sub-tasks
* Routes tasks to appropriate agents
* Combines all responses into a final answer

#### 2. Data Agent (Internal)

* Works with **internal company data (SQLite)**
* Handles:

  * employee data
  * salaries
  * internal metrics

#### 3. Web Agent (External)

* Fetches **real external data**
* Uses:

  * public APIs (BLS, DuckDuckGo)
  * LLM-based research (Groq)

#### 4. Generic Agent

* Handles:

  * explanations
  * recommendations
  * reasoning queries
* No DB or API access (LLM-only)

---

## 🔐 Security Design

Strict separation between agents:

| Agent         | Access             |
| ------------- | ------------------ |
| Data Agent    | Internal DB only   |
| Web Agent     | External APIs only |
| Generic Agent | LLM reasoning only |
| Supervisor    | Orchestrates only  |

👉 No sensitive data is exposed externally.

---

## ⚙️ Tech Stack

### Backend

* Node.js
* SQLite
* Groq LLM (LLaMA 3.3 70B)
* Express API

### Frontend

* React (Vite)
* TailwindCSS
* React Markdown

---

## 📁 Project Structure

```text
multi-agent-system/
│
├── agents/
│   ├── supervisorAgent.js
│   ├── dataAgent.js
│   ├── webAgent.js
│   ├── genericAgent.js
│
├── utils/
│   ├── taskRouter.js
│   ├── ollama.js
│
├── data/
│   └── employees.db
│
├── scripts/
│   └── testOllama.js
│
├── server.js
├── main.js
├── .env
└── README.md
```

---

## 🚀 How It Works

### Example Query

> "How does our team's salary compare to industry benchmarks?"

### Flow

1. Supervisor receives query
2. Task Router splits into:

   * Data Agent → internal data
   * Web Agent → industry benchmarks
3. Agents run in parallel
4. Supervisor synthesizes final answer

---

## 🧪 Running the Project

---

### 🔹 1. Clone Repository

```bash
git clone <your-repo-url>
cd multi-agent-system
```

---

### 🔹 2. Install Dependencies

```bash
npm install
```

---

### 🔹 3. Setup Environment Variables

Create `.env` file:

```env
GROQ_API_KEY=your_api_key_here
OLLAMA_URL=http://38.87.238.254:42369
OLLAMA_MODEL=qwen3.5:35b
PORT=3001
```

---

### 🔹 4. Start Backend API

```bash
node server.js
```

👉 Runs at:

```
http://localhost:3001
```

---

### 🔹 5. Start Frontend UI

Go to UI folder:

```bash
cd multi-agent-ui
npm install
npm run dev
```

👉 Open:

```
http://localhost:5173
```

---

## 💬 Example Queries

* Explain employee turnover
* How can we improve team productivity?
* Compare our salaries with market benchmarks
* Give recommendations for employee retention

---

## 📊 Features

* Multi-agent orchestration
* Intelligent task decomposition (LLM-based)
* Parallel agent execution
* Real internal + external data
* Secure architecture
* Interactive UI dashboard

---

## 🧠 Design Decisions

* Used **Supervisor pattern** for control and security
* Used **LLM-based routing** instead of hardcoded logic
* Avoided message queues to reduce complexity
* Designed for scalability (can add more agents easily)

---

## 🚀 Future Improvements

* Streaming responses (real-time UI updates)
* Agent execution timeline
* Charts & analytics
* Memory agent (conversation history)
* Message queue (Kafka/RabbitMQ) for scaling

---

## 👨‍💻 Author

Built as a production-style multi-agent system demonstrating real-world orchestration patterns.

---

## ⭐ Notes

* Ensure backend is running before UI
* External APIs may vary in response
* LLM responses are controlled via structured prompts

# What Was Used and Why
## Postcraft — AI Content Pipeline

---

Postcraft takes a rough content idea — a few sentences, a URL, a product update — and returns three scored, platform-native social media posts: one for LinkedIn, one for Twitter/X, and one for Instagram. Each post is built specifically for its platform — not the same text reformatted, but genuinely different content written to the rules of each environment. LinkedIn posts are structured for organic reach: a scroll-stopping first line, a scannable narrative arc, specific numbers over vague claims, and a question that drives comments. Twitter/X posts are built around a single punchy idea with no throat-clearing, arrow-list formatting native to the platform, and a closing line that lands with weight. posts open with a scene or moment rather than a claim, use short mobile-first paragraphs, and end with "Link in bio" — the only CTA that converts on that platform. These aren't style preferences — they're the documented patterns that separate high-performing organic content from content that gets ignored. The pipeline enforces them by design, which means every post that comes out has a structural advantage over something written without that discipline.

The pipeline doesn't just generate and hand over whatever came out. Every post is evaluated against a six-criterion rubric, and anything that doesn't pass gets rewritten before the user sees it. The scores and the reasoning behind them are visible in the interface. Postcraft is not a wrapper around a single model call — it is a pipeline of specialized AI agents that generate, judge, revise, and humanize content in sequence, with conditional logic routing posts back through the system when they fall short.

---

### Claude Sonnet + LangGraph

Claude SoAnthropic) powers every AI agent in the pipeline: the brief analyst, the platform router, the three platform generators, the eval agent, the revision agent, and the humanizer. Each runs as a distinct agent with its own system prompt, role, and decision scope. No single model call does more than one job.

LangGraph is the orchestration framework that connects these agents and manages the flow between them. It enables the three platform generators to run simultaneously rather than sequentially — cutting wait time roughly in half. When the eval agent determines a post has failed, LangGraph's conditional edge routing sends only that platform's post back to the generator for a targeted rewrite — not a full pipeline restart. The brief analyst reasons over the input and extracts structured intent before any generation begins. The platform router uses that structured intent to set platform-specific generation rules dynamically, adjusting for content type and voice profile. Every step involves an LLM making a deon, not just producing text. LangGraph was the right tool specifically because the pipeline makes decisions, not just completions.

---

### The scoring layer

Every post is evaluated on six weighted criteria before it reaches the user: brief faithfulness, platform nativity, hook strength, factual accuracy (where applicable), CTA clarity, and brand voice match. A post must clear both a weighted overall threshold and a minimum floor on every individual criterion. The system surfaces what failed and why — it doesn't hide underperforming output.

The scoring is performed by a dedicated eval agent — an LLM-powered agent whose only role is to judge, not generate. It scores each post by comparing it against a set of gold-standard exemplar posts retrieved from Supabase via a RAG (retrieval-augmented generation) system — real, curated examples of what outstanding content looks like on each platform, chosen and annotated before the pipeline runs. The eval agent reasons over the generated post, the original brid the exemplars simultaneously, then produces a structured score with a criterion-by-criterion rationale. If a post fails, a separate revision agent — again LLM-powered, again with its own distinct role and prompt — receives the eval agent's specific feedback and rewrites only what fell short. This separation of generation, judgment, and revision into distinct agentic roles is what makes Postcraft meaningfully more than a wrapper.

---

### The humanization layer

After a post passes evaluation it goes through a dedicated humanizer agent — a further LLM pass whose sole job is to break the recognizable patterns of machine-generated writing: overly parallel structure, banned filler phrases, unnaturally perfect grammar, and generic transitions. First-person judgment markers, sentence-length variation, and deliberate fragments are introduced. The result reads like a person wrote it, not a pipeline. This agent runs in parallel across all three platform posts simultaneously before the final output is assemb---

### FastAPI, Next.js, Supabase, Vercel, Railway

FastAPI handles the backend API — chosen for native async support that allows all parallel agent calls to run concurrently without blocking. Next.js handles the frontend — chosen for Vercel compatibility and industry-standard React conventions. Supabase stores voice profiles, gold-standard exemplar posts (the RAG knowledge base the eval agent retrieves from), and run history (which doubles as future fine-tuning data). Vercel and Railway host the frontend and backend respectively, both connected directly to GitHub for automatic deploys on every push.

---

### The one honest limitation

Instagram is the hardest platform. Its native format is visual-first, scene-led, and short — genuinely harder to generate well than LinkedIn's thought-leadership format or Twitter's punchy one-liners. The eval agent correctly identifies when an Instagram post falls short. The pipeline surfaces that honestly rather than ship something that looks fine in the interface uldn't perform in the real world.

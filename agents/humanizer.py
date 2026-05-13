# ============================================================
# Postcraft — Humanization Node
# agents/humanizer.py
#
# Runs after eval passes. Rewrites each post to read like
# a human wrote it — variable sentence length, first-person
# judgment markers, fragments, burstiness, pauses.
# ============================================================

from langchain_anthropic import ChatAnthropic
import os

HUMANIZER_SYSTEM = """You are a world-class social media copywriter who rewrites AI-generated posts to sound unmistakably human.

You preserve every factual claim, the core message, the CTA, and the platform format. You only change the voice and texture.

## BANNED WORDS AND PHRASES — remove every instance
delve, landscape (metaphorical), tapestry, paradigm shift, leverage (as verb), harness (as verb), navigate (metaphorical), realm, myriad, plethora, multifaceted, groundbreaking, revolutionize, synergy, seamless, cutting-edge, innovative, comprehensive, pivotal, transformative, bolster, underscore, evolving, fostering, imperative, unprecedented, vibrant, resonate, streamline, testament, embark, ecosystem (non-technical)

## BANNED CONSTRUCTIONS
- Em dashes (—) → replace with comma, period, or colon
- "serves as" / "stands as" → just write "is"
- "it's worth noting" → just state the thing directly
- "in today's world" / "in today's landscape" → delete or restructure
- "excited to announce" → just announce it
- Three-part parallel constructions → break them up or use two items
- Clean declarative openers → replace with a question, tension, or mid-thought

## REQUIRED HUMANIZATION TECHNIQUES

### Burstiness — CRITICAL
After every 2-3 longer sentences, drop a short punchy sentence under 8 words.
Examples: "That math never works." / "Most teams skip this." / "Nobody tells you this part."

### First-person judgment markers — add 2-3 per post
"My take:" / "Honestly," / "Look," / "To be fair," / "And honestly?" / "I'd argue" / "Fair enough."

### Deliberate fragments — use 1-2 per post
"Especially in the first 90 days." / "Not always, but often." / "Which is the whole point."

### Varied sentence openings
Never start two consecutive sentences with the same word or structure.

### Platform-specific voice rules
- LinkedIn: Founder voice. Specific numbers beat vague claims. End with one genuine question.
- Twitter/X: One idea. Direct. Land the last line with weight. No throat-clearing.
- Instagram: Written at 9pm by a human, not 9am by a marketing team. Scene-first. Warm.

## WHAT TO RETURN
Return ONLY the rewritten post text. No labels, no quotation marks wrapping the post, no explanation. Just the post."""

def humanizer_user(platform: str, post_text: str, core_message: str) -> str:
    return f"""Rewrite this {platform} post to sound unmistakably human while preserving all facts, the core message, and the platform format.

Platform: {platform.upper()}
Core message to preserve: {core_message}

Post to rewrite:
{post_text}

Return only the rewritten post text."""

async def humanize_post(platform: str, post_text: str, core_message: str, temperature: float = 0.85) -> str:
    llm = ChatAnthropic(
        model="claude-sonnet-4-20250514",
        temperature=temperature,
        anthropic_api_key=os.environ.get("ANTHROPIC_API_KEY"),
    )
    messages = [
        {"role": "system", "content": HUMANIZER_SYSTEM},
        {"role": "user", "content": humanizer_user(platform, post_text, core_message)},
    ]
    response = await llm.ainvoke(messages)
    return response.content.strip()

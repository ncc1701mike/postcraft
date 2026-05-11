import httpx
from bs4 import BeautifulSoup

async def fetch_url_text(url: str) -> str:
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(url, follow_redirects=True)
        response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()
    text = soup.get_text(separator="\n", strip=True)
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    return "\n".join(lines)[:8000]

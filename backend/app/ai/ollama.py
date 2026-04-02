"""
Ollama AI service abstraction layer
"""
import time
from typing import Optional
import httpx

from app.core.config import settings


class OllamaService:
    """Service for interacting with Ollama API"""
    
    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL
        self.model = settings.OLLAMA_MODEL
        self.timeout = settings.OLLAMA_TIMEOUT_SECONDS
    
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> tuple[str, int]:
        """
        Generate a response from Ollama
        Returns: (response_text, latency_ms)
        """
        start_time = time.time()
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                payload = {
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": temperature,
                    },
                }
                
                if system_prompt:
                    payload["system"] = system_prompt
                
                if max_tokens:
                    payload["options"]["num_predict"] = max_tokens
                
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json=payload,
                )
                response.raise_for_status()
                
                result = response.json()
                response_text = result.get("response", "")
                
                latency_ms = int((time.time() - start_time) * 1000)
                return response_text, latency_ms
        
        except httpx.HTTPError as e:
            raise ConnectionError(f"Failed to connect to Ollama: {str(e)}")
        except Exception as e:
            raise RuntimeError(f"Error generating response: {str(e)}")
    
    async def health_check(self) -> bool:
        """Check if Ollama is available"""
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                response = await client.get(f"{self.base_url}/api/tags")
                return response.status_code == 200
        except Exception:
            return False

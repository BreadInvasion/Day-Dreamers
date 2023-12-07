import uvicorn

from config.config import settings

if __name__ == "__main__":
    uvicorn.run(
        "api.api:app",
        host=("::" if settings.is_ipv6 else "0.0.0.0"),
        port=8080,
        reload=True,
        root_path="/api",
        proxy_headers=True,
    )

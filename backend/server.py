from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Node.js backend URL
NODE_BACKEND = "http://localhost:5000"

@app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def proxy(request: Request, path: str):
    """Proxy all /api/* requests to the Node.js backend"""
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Build the target URL
        url = f"{NODE_BACKEND}/api/{path}"
        
        # Get query params
        if request.query_params:
            url += f"?{request.query_params}"
        
        # Get headers (forward relevant ones)
        headers = {}
        for key, value in request.headers.items():
            if key.lower() not in ['host', 'content-length']:
                headers[key] = value
        
        # Get cookies
        cookies = dict(request.cookies)
        
        # Get body for POST/PUT/PATCH
        body = None
        if request.method in ["POST", "PUT", "PATCH"]:
            body = await request.body()
        
        # Make the proxied request
        try:
            response = await client.request(
                method=request.method,
                url=url,
                headers=headers,
                cookies=cookies,
                content=body,
            )
            
            # Return the response
            return Response(
                content=response.content,
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type=response.headers.get("content-type", "application/json")
            )
        except Exception as e:
            return Response(
                content=f'{{"error": "{str(e)}"}}',
                status_code=502,
                media_type="application/json"
            )

@app.get("/health")
async def health():
    return {"status": "ok", "proxy": True}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

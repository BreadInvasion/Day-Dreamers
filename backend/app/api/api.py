import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta

app = FastAPI()

origins = ['http://localhost', 'localhost']

app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.post("/myevent")
async def root():
    return {"start": int(datetime.now().timestamp()), "end": int((datetime.now() + timedelta(hours=1)).timestamp()), "title": "Going to Your Mom's House"}
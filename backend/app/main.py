from starlette.requests import Request
from starlette.responses import JSONResponse

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exception_handlers import request_validation_exception_handler

from app.routes.user import router as user_router
from app.routes.tags import router as tags_router
from app.routes.videos import router as videos_router
from app.utils.logging import setup_logger
from app.routes.listings import router as listings_router
from app.routes.influencers import router as influencers_router
from app.routes.restaurants import router as restaurants_router

# Configure logging
logger = setup_logger(__name__)

# Initialize app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # For local development
        "http://localhost",  # For local development
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

# Register routes
app.include_router(user_router, prefix="/user", tags=["user"])
app.include_router(influencers_router, prefix="/influencers", tags=["influencers"])
app.include_router(videos_router, prefix="/videos", tags=["videos"])
app.include_router(restaurants_router, prefix="/restaurants", tags=["restaurants"])
app.include_router(listings_router, prefix="/listings", tags=["listings"])
app.include_router(tags_router, prefix="/tags", tags=["tags"])

# Custom exception handler for validation errors
@app.exception_handler(RequestValidationError)
async def custom_validation_exception_handler(request: Request, exc: RequestValidationError):
    # Check if any error is specifically about the 'file' field expecting an UploadFile
    for error in exc.errors():
        if error["loc"] == ["body", "file"] and "Expected UploadFile" in error["msg"]:
            return JSONResponse(
                status_code=422,
                content={"detail": [
                    {
                        "loc": error["loc"],
                        "msg": "Error uploading file: Invalid file input. Please re-select the CSV file or refresh the page and try again.",
                        "type": "value_error"
                    }
                ]}
            )
    
    # For all other validation errors, use the default handler
    return await request_validation_exception_handler(request, exc)

@app.get("/")
def root():
    return {"message": "Influencer Food Map API is live!"}

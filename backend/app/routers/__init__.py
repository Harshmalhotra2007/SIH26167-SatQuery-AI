from fastapi import APIRouter
from app.routers import upload, query, change

router = APIRouter()
router.include_router(upload.router)
router.include_router(query.router)
router.include_router(change.router)

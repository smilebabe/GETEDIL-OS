# apps/api/services/p4_hired/router.py

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field, validator
from supabase import Client, create_client
import os
from enum import Enum

router = APIRouter(prefix="/p4/hired", tags=["GetHired"])
security = HTTPBearer()

# Initialize Supabase client
supabase: Client = create_client(
    os.getenv("SUPABASE_URL", ""),
    os.getenv("SUPABASE_KEY", "")
)

# ========== Enums ==========

class JobCategory(str, Enum):
    TECHNOLOGY = "technology"
    CONSTRUCTION = "construction"
    HEALTHCARE = "healthcare"
    EDUCATION = "education"
    AGRICULTURE = "agriculture"
    TRANSPORTATION = "transportation"
    HOSPITALITY = "hospitality"
    MANUFACTURING = "manufacturing"
    RETAIL = "retail"
    FINANCE = "finance"
    CONSULTING = "consulting"
    CREATIVE = "creative"
    LEGAL = "legal"
    REAL_ESTATE = "real_estate"
    CLEANING = "cleaning"
    SECURITY = "security"
    LOGISTICS = "logistics"
    OTHER = "other"

class JobStatus(str, Enum):
    DRAFT = "draft"
    OPEN = "open"
    IN_REVIEW = "in_review"
    ASSIGNED = "assigned"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    EXPIRED = "expired"

class BidStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"

# ========== Pydantic Models ==========

class BidRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Bid amount in ETB")
    proposal: str = Field(..., min_length=50, max_length=5000)
    estimated_days: int = Field(..., gt=0, le=365)
    cover_letter: Optional[str] = Field(None, max_length=2000)
    attachments: Optional[List[str]] = Field(default_factory=list)

    @validator('amount')
    def validate_amount(cls, v):
        return round(v, 2)

class BidResponse(BaseModel):
    id: UUID
    job_id: UUID
    bidder_id: UUID
    amount: float
    proposal: str
    estimated_days: int
    status: BidStatus
    ai_match_score: Optional[float]
    created_at: datetime

class JobResponse(BaseModel):
    id: UUID
    creator_id: UUID
    title: str
    description_am: Optional[str]
    description_en: Optional[str]
    budget_min: float
    budget_max: Optional[float]
    category: JobCategory
    status: JobStatus
    location: Optional[str]
    is_remote: bool
    required_skills: List[str]
    experience_level: str
    deadline: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    total_bids: Optional[int] = 0
    match_score: Optional[float] = None

class JobsResponse(BaseModel):
    jobs: List[JobResponse]
    total: int
    page: int
    limit: int
    has_more: bool

class RecommendedJobResponse(BaseModel):
    id: UUID
    title: str
    category: JobCategory
    budget_min: float
    budget_max: Optional[float]
    location: Optional[str]
    is_remote: bool
    match_score: float
    match_reasons: List[str]

class RecommendedJobsResponse(BaseModel):
    jobs: List[RecommendedJobResponse]
    total: int
    generated_at: datetime

# ========== Helper Functions ==========

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """Extract and validate user from JWT token"""
    token = credentials.credentials
    
    try:
        # Verify token with Supabase
        user = supabase.auth.get_user(token)
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        # Get full profile from profiles table
        profile = supabase.table("profiles").select("*").eq("id", str(user.user.id)).execute()
        
        if not profile.data:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        return {
            "id": UUID(profile.data[0]["id"]),
            "email": user.user.email,
            "role": profile.data[0].get("role", "user"),
            "skills": profile.data[0].get("skills", []),
            "experience_level": profile.data[0].get("experience_level", "entry")
        }
    
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

async def verify_job_ownership(job_id: UUID, user_id: UUID) -> bool:
    """Verify if user is the job creator"""
    result = supabase.table("jobs").select("creator_id").eq("id", str(job_id)).execute()
    
    if not result.data:
        return False
    
    return result.data[0]["creator_id"] == str(user_id)

# ========== Endpoints ==========

@router.get("/jobs", response_model=JobsResponse)
async def get_jobs(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    category: Optional[JobCategory] = Query(None, description="Filter by category"),
    status: Optional[JobStatus] = Query(JobStatus.OPEN, description="Filter by status"),
    min_budget: Optional[float] = Query(None, ge=0, description="Minimum budget"),
    max_budget: Optional[float] = Query(None, ge=0, description="Maximum budget"),
    remote_only: bool = Query(False, description="Show only remote jobs"),
    location: Optional[str] = Query(None, description="Filter by location"),
    search: Optional[str] = Query(None, description="Search in title and description"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get paginated list of jobs with filtering"""
    
    offset = (page - 1) * limit
    
    # Build query
    query = supabase.table("jobs").select("*", count="exact")
    
    # Apply filters
    if category:
        query = query.eq("category", category.value)
    
    if status:
        query = query.eq("status", status.value)
    
    if min_budget:
        query = query.gte("budget_min", min_budget)
    
    if max_budget:
        query = query.lte("budget_max", max_budget)
    
    if remote_only:
        query = query.eq("is_remote", True)
    
    if location:
        query = query.ilike("location", f"%{location}%")
    
    if search:
        query = query.or_(f"title.ilike.%{search}%,description_en.ilike.%{search}%,description_am.ilike.%{search}%")
    
    # Get total count and data
    result = query.range(offset, offset + limit - 1).order("created_at", desc=True).execute()
    
    jobs = []
    for job in result.data:
        # Get bid count for each job
        bid_count = supabase.table("bids").select("id", count="exact").eq("job_id", job["id"]).execute()
        
        job_response = JobResponse(
            id=UUID(job["id"]),
            creator_id=UUID(job["creator_id"]),
            title=job["title"],
            description_am=job.get("description_am"),
            description_en=job.get("description_en"),
            budget_min=float(job["budget_min"]),
            budget_max=float(job["budget_max"]) if job.get("budget_max") else None,
            category=JobCategory(job["category"]),
            status=JobStatus(job["status"]),
            location=job.get("location"),
            is_remote=job.get("is_remote", False),
            required_skills=job.get("required_skills", []),
            experience_level=job.get("experience_level", "any"),
            deadline=datetime.fromisoformat(job["deadline"]) if job.get("deadline") else None,
            created_at=datetime.fromisoformat(job["created_at"]),
            updated_at=datetime.fromisoformat(job["updated_at"]),
            total_bids=bid_count.count if bid_count.count else 0
        )
        jobs.append(job_response)
    
    return JobsResponse(
        jobs=jobs,
        total=result.count or 0,
        page=page,
        limit=limit,
        has_more=(offset + limit) < (result.count or 0)
    )

@router.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job_details(
    job_id: UUID,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get detailed information about a specific job"""
    
    result = supabase.table("jobs").select("*").eq("id", str(job_id)).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = result.data[0]
    
    # Get bid count
    bid_count = supabase.table("bids").select("id", count="exact").eq("job_id", str(job_id)).execute()
    
    return JobResponse(
        id=UUID(job["id"]),
        creator_id=UUID(job["creator_id"]),
        title=job["title"],
        description_am=job.get("description_am"),
        description_en=job.get("description_en"),
        budget_min=float(job["budget_min"]),
        budget_max=float(job["budget_max"]) if job.get("budget_max") else None,
        category=JobCategory(job["category"]),
        status=JobStatus(job["status"]),
        location=job.get("location"),
        is_remote=job.get("is_remote", False),
        required_skills=job.get("required_skills", []),
        experience_level=job.get("experience_level", "any"),
        deadline=datetime.fromisoformat(job["deadline"]) if job.get("deadline") else None,
        created_at=datetime.fromisoformat(job["created_at"]),
        updated_at=datetime.fromisoformat(job["updated_at"]),
        total_bids=bid_count.count or 0
    )

@router.post("/jobs/{job_id}/bid", response_model=BidResponse, status_code=status.HTTP_201_CREATED)
async def submit_bid(
    job_id: UUID,
    bid: BidRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Submit a bid for a job"""
    
    # Check if job exists and is open
    job_result = supabase.table("jobs").select("*").eq("id", str(job_id)).execute()
    
    if not job_result.data:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = job_result.data[0]
    
    if job["status"] != JobStatus.OPEN.value:
        raise HTTPException(status_code=400, detail="Job is not accepting bids")
    
    # Check if user already bid
    existing_bid = supabase.table("bids").select("id").eq("job_id", str(job_id)).eq("bidder_id", str(current_user["id"])).execute()
    
    if existing_bid.data:
        raise HTTPException(status_code=409, detail="You have already submitted a bid for this job")
    
    # Validate bid amount against budget
    if bid.amount < job["budget_min"]:
        raise HTTPException(status_code=400, detail=f"Bid amount below minimum budget of {job['budget_min']}")
    
    if job.get("budget_max") and bid.amount > job["budget_max"]:
        raise HTTPException(status_code=400, detail=f"Bid amount exceeds maximum budget of {job['budget_max']}")
    
    # Calculate simple match score (Gemini will replace this)
    match_score = 75.0  # Stub value
    
    # Insert bid
    bid_data = {
        "job_id": str(job_id),
        "bidder_id": str(current_user["id"]),
        "amount": bid.amount,
        "proposal": bid.proposal,
        "estimated_days": bid.estimated_days,
        "cover_letter": bid.cover_letter,
        "attachments": bid.attachments,
        "ai_match_score": match_score,
        "status": BidStatus.PENDING.value
    }
    
    result = supabase.table("bids").insert(bid_data).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to submit bid")
    
    new_bid = result.data[0]
    
    # Emit event (placeholder - implement with actual event bus)
    # await emit_event("bid.submitted", {...})
    
    return BidResponse(
        id=UUID(new_bid["id"]),
        job_id=UUID(new_bid["job_id"]),
        bidder_id=UUID(new_bid["bidder_id"]),
        amount=float(new_bid["amount"]),
        proposal=new_bid["proposal"],
        estimated_days=new_bid["estimated_days"],
        status=BidStatus(new_bid["status"]),
        ai_match_score=new_bid.get("ai_match_score"),
        created_at=datetime.fromisoformat(new_bid["created_at"])
    )

@router.get("/jobs/recommended", response_model=RecommendedJobsResponse)
async def get_recommended_jobs(
    limit: int = Query(20, ge=1, le=50, description="Number of recommendations"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get AI-powered job recommendations.
    Currently stubbed - will integrate with Gemini Match Engine.
    """
    
    # STUB: This will be replaced with actual Gemini Match Engine call
    # For now, return jobs based on user's skills and experience
    
    user_skills = current_user.get("skills", [])
    user_experience = current_user.get("experience_level", "entry")
    
    # Simple fallback query (Gemini will replace this logic)
    query = supabase.table("jobs").select("*").eq("status", JobStatus.OPEN.value).limit(limit)
    
    if user_skills:
        # Simple skill matching - Gemini will do semantic matching
        query = query.contains("required_skills", user_skills[:3])
    
    result = query.execute()
    
    recommended_jobs = []
    for idx, job in enumerate(result.data):
        # Calculate stub match score
        match_score = round(85.0 - (idx * 2), 1)
        match_score = max(60.0, min(98.0, match_score))
        
        recommended_jobs.append(RecommendedJobResponse(
            id=UUID(job["id"]),
            title=job["title"],
            category=JobCategory(job["category"]),
            budget_min=float(job["budget_min"]),
            budget_max=float(job["budget_max"]) if job.get("budget_max") else None,
            location=job.get("location"),
            is_remote=job.get("is_remote", False),
            match_score=match_score,
            match_reasons=[
                "Skills alignment detected",
                "Experience level matches",
                "Budget within range"
            ][:3]
        ))
    
    return RecommendedJobsResponse(
        jobs=recommended_jobs,
        total=len(recommended_jobs),
        generated_at=datetime.utcnow()
    )

@router.get("/my/bids", response_model=List[BidResponse])
async def get_my_bids(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get all bids submitted by the current user"""
    
    result = supabase.table("bids").select("*").eq("bidder_id", str(current_user["id"])).order("created_at", desc=True).execute()
    
    bids = []
    for bid in result.data:
        bids.append(BidResponse(
            id=UUID(bid["id"]),
            job_id=UUID(bid["job_id"]),
            bidder_id=UUID(bid["bidder_id"]),
            amount=float(bid["amount"]),
            proposal=bid["proposal"],
            estimated_days=bid["estimated_days"],
            status=BidStatus(bid["status"]),
            ai_match_score=bid.get("ai_match_score"),
            created_at=datetime.fromisoformat(bid["created_at"])
        ))
    
    return bids

@router.get("/my/jobs", response_model=List[JobResponse])
async def get_my_jobs(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get all jobs created by the current user"""
    
    result = supabase.table("jobs").select("*").eq("creator_id", str(current_user["id"])).order("created_at", desc=True).execute()
    
    jobs = []
    for job in result.data:
        # Get bid count
        bid_count = supabase.table("bids").select("id", count="exact").eq("job_id", job["id"]).execute()
        
        jobs.append(JobResponse(
            id=UUID(job["id"]),
            creator_id=UUID(job["creator_id"]),
            title=job["title"],
            description_am=job.get("description_am"),
            description_en=job.get("description_en"),
            budget_min=float(job["budget_min"]),
            budget_max=float(job["budget_max"]) if job.get("budget_max") else None,
            category=JobCategory(job["category"]),
            status=JobStatus(job["status"]),
            location=job.get("location"),
            is_remote=job.get("is_remote", False),
            required_skills=job.get("required_skills", []),
            experience_level=job.get("experience_level", "any"),
            deadline=datetime.fromisoformat(job["deadline"]) if job.get("deadline") else None,
            created_at=datetime.fromisoformat(job["created_at"]),
            updated_at=datetime.fromisoformat(job["updated_at"]),
            total_bids=bid_count.count or 0
        ))
    
    return jobs

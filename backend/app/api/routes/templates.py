"""
Subtitle templates API routes
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/templates", tags=["templates"])


# --- Pydantic Models ---

class SubtitleStyleTemplate(BaseModel):
    font_family: str = "Arial"
    font_size: int = 24
    font_color: str = "#FFFFFF"
    background_color: str = "transparent"
    outline_color: str = "#000000"
    outline_width: int = 2
    position: str = "bottom"  # top, center, bottom
    bold: bool = False
    italic: bool = False


class Template(BaseModel):
    id: str
    name: str
    description: str
    style: SubtitleStyleTemplate
    is_default: bool = False
    is_favorite: bool = False
    is_system: bool = False  # System templates can't be deleted
    created_at: str
    updated_at: str


class CreateTemplateRequest(BaseModel):
    name: str
    description: Optional[str] = ""
    style: SubtitleStyleTemplate


class UpdateTemplateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    style: Optional[SubtitleStyleTemplate] = None
    is_default: Optional[bool] = None
    is_favorite: Optional[bool] = None


# --- Default System Templates ---

SYSTEM_TEMPLATES = [
    Template(
        id="sys-classic",
        name="Classic",
        description="Clean white text with black outline",
        style=SubtitleStyleTemplate(
            font_family="Arial", font_size=24, font_color="#FFFFFF",
            background_color="transparent", outline_color="#000000", outline_width=2,
            position="bottom", bold=False, italic=False
        ),
        is_default=True, is_favorite=True, is_system=True,
        created_at=datetime.utcnow().isoformat(), updated_at=datetime.utcnow().isoformat()
    ),
    Template(
        id="sys-cinematic",
        name="Cinematic",
        description="Yellow text for movie-style captions",
        style=SubtitleStyleTemplate(
            font_family="Georgia", font_size=26, font_color="#FFD700",
            background_color="transparent", outline_color="#000000", outline_width=2,
            position="bottom", bold=False, italic=True
        ),
        is_default=False, is_favorite=False, is_system=True,
        created_at=datetime.utcnow().isoformat(), updated_at=datetime.utcnow().isoformat()
    ),
    Template(
        id="sys-modern-dark",
        name="Modern Dark",
        description="Semi-transparent dark background",
        style=SubtitleStyleTemplate(
            font_family="Inter", font_size=22, font_color="#FFFFFF",
            background_color="rgba(0,0,0,0.7)", outline_color="transparent", outline_width=0,
            position="bottom", bold=True, italic=False
        ),
        is_default=False, is_favorite=True, is_system=True,
        created_at=datetime.utcnow().isoformat(), updated_at=datetime.utcnow().isoformat()
    ),
    Template(
        id="sys-youtube",
        name="YouTube Style",
        description="Perfect for YouTube content",
        style=SubtitleStyleTemplate(
            font_family="Roboto", font_size=24, font_color="#FFFFFF",
            background_color="rgba(0,0,0,0.8)", outline_color="transparent", outline_width=0,
            position="bottom", bold=True, italic=False
        ),
        is_default=False, is_favorite=False, is_system=True,
        created_at=datetime.utcnow().isoformat(), updated_at=datetime.utcnow().isoformat()
    ),
    Template(
        id="sys-netflix",
        name="Netflix",
        description="Netflix-inspired subtitle style",
        style=SubtitleStyleTemplate(
            font_family="Arial", font_size=28, font_color="#FFFFFF",
            background_color="transparent", outline_color="#000000", outline_width=4,
            position="bottom", bold=True, italic=False
        ),
        is_default=False, is_favorite=True, is_system=True,
        created_at=datetime.utcnow().isoformat(), updated_at=datetime.utcnow().isoformat()
    ),
]

# In-memory storage for custom templates (use database in production)
custom_templates: dict = {}


# --- Routes ---

@router.get("/", response_model=List[Template])
async def list_templates():
    """List all templates (system + custom)"""
    all_templates = SYSTEM_TEMPLATES.copy()
    all_templates.extend(custom_templates.values())
    return all_templates


@router.get("/system", response_model=List[Template])
async def list_system_templates():
    """List only system templates"""
    return SYSTEM_TEMPLATES


@router.get("/custom", response_model=List[Template])
async def list_custom_templates():
    """List only user's custom templates"""
    return list(custom_templates.values())


@router.get("/default", response_model=Template)
async def get_default_template():
    """Get the current default template"""
    for t in SYSTEM_TEMPLATES + list(custom_templates.values()):
        if t.is_default:
            return t
    return SYSTEM_TEMPLATES[0]  # Fallback to Classic


@router.get("/{template_id}", response_model=Template)
async def get_template(template_id: str):
    """Get a specific template"""
    # Check system templates
    for t in SYSTEM_TEMPLATES:
        if t.id == template_id:
            return t
    
    # Check custom templates
    if template_id in custom_templates:
        return custom_templates[template_id]
    
    raise HTTPException(status_code=404, detail="Template not found")


@router.post("/", response_model=Template)
async def create_template(request: CreateTemplateRequest):
    """Create a new custom template"""
    template_id = f"custom-{uuid.uuid4().hex[:8]}"
    now = datetime.utcnow().isoformat()
    
    template = Template(
        id=template_id,
        name=request.name,
        description=request.description or "",
        style=request.style,
        is_default=False,
        is_favorite=False,
        is_system=False,
        created_at=now,
        updated_at=now
    )
    
    custom_templates[template_id] = template
    
    return template


@router.put("/{template_id}", response_model=Template)
async def update_template(template_id: str, request: UpdateTemplateRequest):
    """Update a template"""
    # Check if it's a system template
    for t in SYSTEM_TEMPLATES:
        if t.id == template_id:
            # Can only update is_default and is_favorite for system templates
            if request.is_default is not None:
                t.is_default = request.is_default
                # If setting as default, unset others
                if request.is_default:
                    for other in SYSTEM_TEMPLATES + list(custom_templates.values()):
                        if other.id != template_id:
                            other.is_default = False
            if request.is_favorite is not None:
                t.is_favorite = request.is_favorite
            return t
    
    # Check custom templates
    if template_id not in custom_templates:
        raise HTTPException(status_code=404, detail="Template not found")
    
    template = custom_templates[template_id]
    
    if request.name is not None:
        template.name = request.name
    if request.description is not None:
        template.description = request.description
    if request.style is not None:
        template.style = request.style
    if request.is_default is not None:
        template.is_default = request.is_default
        if request.is_default:
            for other in SYSTEM_TEMPLATES + list(custom_templates.values()):
                if other.id != template_id:
                    other.is_default = False
    if request.is_favorite is not None:
        template.is_favorite = request.is_favorite
    
    template.updated_at = datetime.utcnow().isoformat()
    
    return template


@router.delete("/{template_id}")
async def delete_template(template_id: str):
    """Delete a custom template"""
    # Check if it's a system template
    for t in SYSTEM_TEMPLATES:
        if t.id == template_id:
            raise HTTPException(status_code=403, detail="Cannot delete system templates")
    
    if template_id not in custom_templates:
        raise HTTPException(status_code=404, detail="Template not found")
    
    del custom_templates[template_id]
    
    return {"success": True, "message": "Template deleted"}


@router.post("/{template_id}/duplicate", response_model=Template)
async def duplicate_template(template_id: str):
    """Duplicate a template"""
    # Find the template
    source = None
    for t in SYSTEM_TEMPLATES:
        if t.id == template_id:
            source = t
            break
    
    if not source and template_id in custom_templates:
        source = custom_templates[template_id]
    
    if not source:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Create duplicate
    new_id = f"custom-{uuid.uuid4().hex[:8]}"
    now = datetime.utcnow().isoformat()
    
    duplicate = Template(
        id=new_id,
        name=f"{source.name} (Copy)",
        description=source.description,
        style=source.style.copy(),
        is_default=False,
        is_favorite=False,
        is_system=False,
        created_at=now,
        updated_at=now
    )
    
    custom_templates[new_id] = duplicate
    
    return duplicate

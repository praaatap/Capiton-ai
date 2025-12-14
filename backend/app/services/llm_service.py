"""LLM orchestration service using LangGraph with Groq/OpenAI support."""
import json
import re
from typing import List, Dict, Any, Optional, TypedDict
from datetime import datetime

from app.config import get_settings
from app.models.video import SubtitleSegment, SubtitleStyle
from app.models.chat import ChatMessage, MessageRole, SubtitleEdit, ChatResponse
from app.services.cache_service import cache_service

settings = get_settings()


# LangGraph State
class EditorState(TypedDict):
    """State for the video editor graph."""
    messages: List
    video_id: str
    subtitles: List[dict]
    pending_edits: List[dict]
    response: str


class LLMService:
    """LLM orchestration service with Groq (free) / OpenAI / Mock support."""
    
    def __init__(self):
        self.provider = "mock"
        self.client = None
        self.model = None
        
        # Try Groq first (free!)
        if settings.GROQ_API_KEY:
            try:
                from groq import Groq
                self.client = Groq(api_key=settings.GROQ_API_KEY)
                self.model = settings.GROQ_MODEL
                self.provider = "groq"
                print(f"✅ LLM Service using Groq ({self.model})")
            except Exception as e:
                print(f"⚠️ Groq init failed: {e}")
        
        # Fallback to OpenAI
        elif settings.OPENAI_API_KEY:
            try:
                from openai import OpenAI
                self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
                self.model = "gpt-4o-mini"
                self.provider = "openai"
                print(f"✅ LLM Service using OpenAI ({self.model})")
            except Exception as e:
                print(f"⚠️ OpenAI init failed: {e}")
        
        if self.provider == "mock":
            print("⚠️ No API key found, using mock LLM mode")
            print("   Get free Groq key at: https://console.groq.com")
    
    def _get_system_prompt(self, subtitles_text: str) -> str:
        """Get the system prompt for subtitle editing."""
        return f"""You are a video subtitle editor assistant. Analyze the user's message and extract any subtitle editing commands.

Current subtitles:
{subtitles_text}

Return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
{{
    "edits": [
        {{
            "action": "style",
            "segment_index": 0,
            "style_changes": {{
                "font_size": 15
            }}
        }}
    ],
    "message": "Done! I've updated the font size."
}}

Rules:
- "action" can be: "add", "modify", "delete", "style"
- "segment_index" is 0-based (first subtitle = 0, second = 1, etc.)
- For style changes, include ONLY the fields being changed:
  - font_size (number, e.g., 15, 20, 24)
  - font_color (hex string, e.g., "#FF0000" for red)
  - font_family (string)
  - bold (boolean)
  - italic (boolean)
  - position ("top", "center", "bottom")
- If user says "first clip" or "first subtitle", use segment_index: 0
- If user says "second clip" or "second subtitle", use segment_index: 1
- If user says "all subtitles", create an edit for EACH segment
- Return empty edits array if request is unclear

Examples:
- "first subtitle 15px, second 20px" → two style edits with font_size
- "make all red" → style edit for each segment with font_color: "#FF0000"
- "bold the first one" → style edit for segment 0 with bold: true"""

    async def _call_llm(self, system_prompt: str, user_message: str) -> str:
        """Call the LLM provider."""
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]
        
        if self.provider == "groq":
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.1,
                max_tokens=1024
            )
            return response.choices[0].message.content
        
        elif self.provider == "openai":
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.1,
                max_tokens=1024
            )
            return response.choices[0].message.content
        
        return ""
    
    def _parse_user_intent_mock(self, user_message: str, subtitles: List[dict]) -> Dict:
        """Parse user intent using simple pattern matching (mock mode)."""
        message_lower = user_message.lower()
        edits = []
        response = "I've processed your request."
        
        # Pattern: font size changes
        size_patterns = [
            (r'(?:first|1st|segment\s*1|clip\s*1)[^0-9]*(\d+)\s*(?:px|font|size)?', 0),
            (r'(?:second|2nd|segment\s*2|clip\s*2)[^0-9]*(\d+)\s*(?:px|font|size)?', 1),
            (r'(?:third|3rd|segment\s*3|clip\s*3)[^0-9]*(\d+)\s*(?:px|font|size)?', 2),
            (r'(\d+)\s*(?:px|font|size)?[^0-9]*(?:for\s+)?(?:the\s+)?(?:first|1st|segment\s*1|clip\s*1)', 0),
            (r'(\d+)\s*(?:px|font|size)?[^0-9]*(?:for\s+)?(?:the\s+)?(?:second|2nd|segment\s*2|clip\s*2)', 1),
        ]
        
        for pattern, segment_idx in size_patterns:
            match = re.search(pattern, message_lower)
            if match and segment_idx < len(subtitles):
                size = int(match.group(1))
                if 8 <= size <= 100:  # Valid font size range
                    edits.append({
                        "action": "style",
                        "segment_index": segment_idx,
                        "style_changes": {"font_size": size}
                    })
        
        # Pattern: "all subtitles ... size X"
        all_size_match = re.search(r'all\s+(?:subtitles?|segments?|clips?)[^0-9]*(\d+)\s*(?:px|font|size)?', message_lower)
        if all_size_match:
            size = int(all_size_match.group(1))
            if 8 <= size <= 100:
                for i in range(len(subtitles)):
                    edits.append({
                        "action": "style",
                        "segment_index": i,
                        "style_changes": {"font_size": size}
                    })
        
        # Color changes
        color_map = {
            'red': '#FF0000', 'green': '#00FF00', 'blue': '#0000FF',
            'yellow': '#FFFF00', 'white': '#FFFFFF', 'black': '#000000',
            'cyan': '#00FFFF', 'magenta': '#FF00FF', 'orange': '#FFA500',
            'pink': '#FF69B4', 'purple': '#800080'
        }
        
        for color_name, color_hex in color_map.items():
            if color_name in message_lower:
                if any(x in message_lower for x in ['first', '1st', 'segment 1']):
                    edits.append({"action": "style", "segment_index": 0, "style_changes": {"font_color": color_hex}})
                elif any(x in message_lower for x in ['second', '2nd', 'segment 2']):
                    edits.append({"action": "style", "segment_index": 1, "style_changes": {"font_color": color_hex}})
                elif 'all' in message_lower:
                    for i in range(len(subtitles)):
                        edits.append({"action": "style", "segment_index": i, "style_changes": {"font_color": color_hex}})
                break
        
        # Bold/Italic
        if 'bold' in message_lower:
            if 'all' in message_lower:
                for i in range(len(subtitles)):
                    edits.append({"action": "style", "segment_index": i, "style_changes": {"bold": True}})
            elif any(x in message_lower for x in ['first', '1st']):
                edits.append({"action": "style", "segment_index": 0, "style_changes": {"bold": True}})
            elif any(x in message_lower for x in ['second', '2nd']):
                edits.append({"action": "style", "segment_index": 1, "style_changes": {"bold": True}})
        
        if 'italic' in message_lower:
            if 'all' in message_lower:
                for i in range(len(subtitles)):
                    edits.append({"action": "style", "segment_index": i, "style_changes": {"italic": True}})
            elif any(x in message_lower for x in ['first', '1st']):
                edits.append({"action": "style", "segment_index": 0, "style_changes": {"italic": True}})
        
        # Position
        for pos in ['top', 'center', 'bottom']:
            if pos in message_lower and any(x in message_lower for x in ['position', 'move', 'place']):
                for i in range(len(subtitles)):
                    edits.append({"action": "style", "segment_index": i, "style_changes": {"position": pos}})
                break
        
        # Translation detection
        translate_languages = {
            'hindi': 'Hindi', 'spanish': 'Spanish', 'french': 'French',
            'german': 'German', 'chinese': 'Chinese', 'japanese': 'Japanese',
            'korean': 'Korean', 'portuguese': 'Portuguese', 'italian': 'Italian',
            'russian': 'Russian', 'arabic': 'Arabic', 'tamil': 'Tamil',
            'telugu': 'Telugu', 'bengali': 'Bengali', 'marathi': 'Marathi'
        }
        
        for lang_key, lang_name in translate_languages.items():
            if lang_key in message_lower and any(x in message_lower for x in ['translate', 'convert', 'change to', 'in ']):
                return {
                    "edits": [],
                    "message": f"TRANSLATE:{lang_name}",
                    "translate_to": lang_name
                }
        
        # Generate response
        if edits:
            response = f"Done! I've applied {len(edits)} style change(s) to your subtitles."
        else:
            response = "I can help you edit subtitles. Try: 'make first subtitle 15px', 'change to red', 'translate to Hindi', or 'bold all'."
        
        return {"edits": edits, "message": response}

    
    def _format_subtitles(self, subtitles: List[dict]) -> str:
        """Format subtitles for LLM context."""
        if not subtitles:
            return "No subtitles yet."
        
        lines = []
        for i, sub in enumerate(subtitles):
            style = sub.get("style", {})
            style_info = f"size={style.get('font_size', 24)}, color={style.get('font_color', '#FFFFFF')}"
            lines.append(
                f"[{i}] {sub.get('start_time', 0):.1f}s-{sub.get('end_time', 0):.1f}s: "
                f"\"{sub.get('text', '')}\" ({style_info})"
            )
        
        return "\n".join(lines)
    
    def _parse_llm_response(self, content: str) -> Dict:
        """Parse LLM response to extract edits."""
        try:
            # Clean up response
            content = content.strip()
            
            # Remove markdown code blocks if present
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
            
            content = content.strip()
            
            # Parse JSON
            parsed = json.loads(content)
            return {
                "edits": parsed.get("edits", []),
                "message": parsed.get("message", "Done!")
            }
        except (json.JSONDecodeError, IndexError) as e:
            print(f"Failed to parse LLM response: {e}")
            print(f"Raw content: {content[:500]}")
            return {"edits": [], "message": content[:200] if content else "I couldn't understand that request."}
    
    async def process_chat(
        self,
        video_id: str,
        user_message: str,
        current_subtitles: List[SubtitleSegment]
    ) -> ChatResponse:
        """Process a chat message and return edits."""
        
        # Convert subtitles to dict format
        subtitles_dict = [
            {
                "id": sub.id,
                "start_time": sub.start_time,
                "end_time": sub.end_time,
                "text": sub.text,
                "style": sub.style.model_dump()
            }
            for sub in current_subtitles
        ]
        
        # Process with LLM or mock
        if self.provider in ["groq", "openai"]:
            subtitles_text = self._format_subtitles(subtitles_dict)
            system_prompt = self._get_system_prompt(subtitles_text)
            
            try:
                llm_response = await self._call_llm(system_prompt, user_message)
                result = self._parse_llm_response(llm_response)
            except Exception as e:
                print(f"LLM call failed: {e}")
                result = self._parse_user_intent_mock(user_message, subtitles_dict)
        else:
            result = self._parse_user_intent_mock(user_message, subtitles_dict)
        
        pending_edits = result["edits"]
        response_text = result["message"]
        
        # Check for translation request
        if result.get("translate_to") or (response_text and response_text.startswith("TRANSLATE:")):
            target_lang = result.get("translate_to") or response_text.split(":")[1]
            from app.services.subtitle_service import subtitle_service
            translated = await subtitle_service.translate_subtitles(current_subtitles, target_lang)
            
            # Update video with translated subtitles
            from app.services.video_service import video_service
            video = await video_service.get_video(video_id)
            if video:
                video.subtitles = translated
                await video_service.update_video(video)
            
            response_text = f"✅ Translated all subtitles to {target_lang}!"
            
            # Store chat messages
            await cache_service.add_chat_message(video_id, {
                "role": "user",
                "content": user_message,
                "timestamp": datetime.utcnow().isoformat()
            })
            await cache_service.add_chat_message(video_id, {
                "role": "assistant",
                "content": response_text,
                "timestamp": datetime.utcnow().isoformat()
            })
            
            return ChatResponse(
                message=response_text,
                edits=[],
                success=True,
                video_id=video_id
            )
        
        # Apply edits to subtitles
        for edit in pending_edits:
            action = edit.get("action")
            segment_index = edit.get("segment_index")
            
            if action == "style" and segment_index is not None:
                if 0 <= segment_index < len(subtitles_dict):
                    style_changes = edit.get("style_changes", {})
                    subtitles_dict[segment_index]["style"].update(style_changes)

        
        # Convert edits to SubtitleEdit objects
        edits = []
        for edit in pending_edits:
            subtitle_edit = SubtitleEdit(
                action=edit.get("action", "modify"),
                segment_id=str(edit.get("segment_index")) if edit.get("segment_index") is not None else None,
                text=edit.get("text"),
                start_time=edit.get("start_time"),
                end_time=edit.get("end_time"),
                style_changes=edit.get("style_changes")
            )
            edits.append(subtitle_edit)
        
        # Update video subtitles in cache
        from app.services.video_service import video_service
        video = await video_service.get_video(video_id)
        if video:
            for i, sub_dict in enumerate(subtitles_dict):
                if i < len(video.subtitles):
                    for key, value in sub_dict.get("style", {}).items():
                        setattr(video.subtitles[i].style, key, value)
            await video_service.update_video(video)
        
        # Store chat messages
        await cache_service.add_chat_message(video_id, {
            "role": "user",
            "content": user_message,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        await cache_service.add_chat_message(video_id, {
            "role": "assistant",
            "content": response_text,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        return ChatResponse(
            message=response_text,
            edits=edits,
            success=True,
            video_id=video_id
        )


# Singleton instance
llm_service = LLMService()

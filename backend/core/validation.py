"""
Enhanced input validation utilities to prevent security vulnerabilities.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, validator
import re


class SecureStringField(str):
    """A string field with built-in security validations."""
    
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
    
    @classmethod
    def validate(cls, v):
        if not isinstance(v, str):
            raise TypeError('string required')
        
        # Prevent potential XSS attacks
        if '<script' in v.lower() or 'javascript:' in v.lower():
            raise ValueError('Invalid characters detected')
        
        # Prevent SQL injection patterns
        dangerous_patterns = ['union', 'select', 'insert', 'update', 'delete', 'drop', '--', '/*', '*/']
        for pattern in dangerous_patterns:
            if pattern in v.lower():
                raise ValueError('Invalid characters detected')
        
        return cls(v)


class EmailField(str):
    """Enhanced email validation."""
    
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
    
    @classmethod
    def validate(cls, v):
        if not isinstance(v, str):
            raise TypeError('string required')
        
        # Basic email format validation
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, v):
            raise ValueError('Invalid email format')
        
        # Prevent extremely long emails
        if len(v) > 254:
            raise ValueError('Email too long')
        
        return cls(v)


class SafeTextField(str):
    """Text field with length and content validation."""
    
    def __new__(cls, value: str, max_length: int = 1000):
        if len(value) > max_length:
            raise ValueError(f'Text too long (max {max_length} characters)')
        
        # Remove potentially dangerous characters
        cleaned = re.sub(r'[<>"\']', '', value)
        return str.__new__(cls, cleaned)


def validate_user_role(role: str) -> str:
    """Validate that role is one of the allowed values."""
    allowed_roles = ['client', 'ambassador']
    if role not in allowed_roles:
        raise ValueError(f'Invalid role. Must be one of: {allowed_roles}')
    return role


def sanitize_input(data: Dict[str, Any]) -> Dict[str, Any]:
    """Sanitize input data to prevent injection attacks."""
    sanitized = {}
    
    for key, value in data.items():
        if isinstance(value, str):
            # Remove potentially dangerous characters
            sanitized[key] = re.sub(r'[<>"\']', '', value)
        elif isinstance(value, list):
            # Recursively sanitize list items
            sanitized[key] = [sanitize_input({'item': item})['item'] if isinstance(item, dict) else item for item in value]
        elif isinstance(value, dict):
            # Recursively sanitize nested dictionaries
            sanitized[key] = sanitize_input(value)
        else:
            sanitized[key] = value
    
    return sanitized


class SecureBaseModel(BaseModel):
    """Base model with enhanced security validations."""
    
    class Config:
        # Prevent arbitrary field assignment
        extra = 'forbid'
        # Use enum values for validation
        use_enum_values = True
        # Validate assignment
        validate_assignment = True
    
    def model_dump_safe(self, **kwargs) -> Dict[str, Any]:
        """Dump model data with security sanitization."""
        data = self.model_dump(**kwargs)
        return sanitize_input(data)

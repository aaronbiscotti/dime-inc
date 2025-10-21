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







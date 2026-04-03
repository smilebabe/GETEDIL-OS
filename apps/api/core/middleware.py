# apps/api/core/middleware.py

import gzip
import brotli
import json
from typing import Callable, Optional, Set
from fastapi import Request, Response
from fastapi.responses import StreamingResponse, JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp, Receive, Scope, Send
import re

class BrotliCompressionMiddleware(BaseHTTPMiddleware):
    """
    Brotli compression middleware optimized for JSON responses, 
    ONNX models, and large job-list payloads.
    """
    
    # Brotli compression quality levels (0-11)
    # Higher = better compression but slower
    BROTLI_QUALITY_FAST = 4      # For dynamic JSON responses
    BROTLI_QUALITY_BALANCED = 6  # For medium payloads
    BROTLI_QUALITY_BEST = 11     # For static assets/ONNX models
    
    # Minimum payload size to compress (bytes)
    MIN_SIZE_BYTES = 512
    
    # Paths that should always use best compression
    HIGH_PRIORITY_PATHS: Set[str] = {
        "/api/p4/hired/jobs",
        "/api/p4/hired/jobs/recommended",
        "/api/p3/verified/profiles",
        "/api/p6/paid/transactions",
        "/api/p9/traded/listings",
        "/api/feed/videos",
        "/api/models/intent-ranker.onnx",
        "/api/models/recommender.onnx",
        "/api/gete/recommendations"
    }
    
    # Content types to compress
    COMPRESSIBLE_TYPES: Set[str] = {
        "application/json",
        "application/javascript",
        "text/html",
        "text/css",
        "text/plain",
        "text/xml",
        "application/xml",
        "application/ld+json",
        "application/geo+json",
        "application/manifest+json"
    }
    
    def __init__(self, app: ASGIApp, minimum_size: int = 512, brotli_quality: int = 6):
        super().__init__(app)
        self.minimum_size = minimum_size
        self.default_quality = brotli_quality
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip compression for small requests or when client doesn't support brotli
        accept_encoding = request.headers.get("accept-encoding", "")
        if "br" not in accept_encoding:
            return await call_next(request)
        
        # Check if this is a streaming response (skip compression)
        if request.headers.get("upgrade", "").lower() == "websocket":
            return await call_next(request)
        
        # Get response
        response = await call_next(request)
        
        # Skip if response is already encoded
        if response.headers.get("content-encoding"):
            return response
        
        # Skip if response is streaming
        if isinstance(response, StreamingResponse):
            return response
        
        # Check content type
        content_type = response.headers.get("content-type", "").split(";")[0]
        if content_type not in self.COMPRESSIBLE_TYPES:
            return response
        
        # Get response body
        body = response.body
        if not body or len(body) < self.minimum_size:
            return response
        
        # Determine compression quality based on path
        quality = self._get_compression_quality(request.url.path)
        
        # Compress with Brotli
        try:
            compressed_body = brotli.compress(
                body,
                quality=quality,
                lgwin=22,  # 4MB window size for better compression
                mode=brotli.MODE_GENERIC
            )
            
            # Only use compression if it actually reduces size
            if len(compressed_body) < len(body):
                response.body = compressed_body
                response.headers["content-encoding"] = "br"
                response.headers["content-length"] = str(len(compressed_body))
                response.headers["vary"] = "Accept-Encoding"
                
                # Add compression ratio header for monitoring
                compression_ratio = (1 - len(compressed_body) / len(body)) * 100
                response.headers["x-compression-ratio"] = f"{compression_ratio:.1f}%"
                
        except brotli.error as e:
            # Fall back to uncompressed on error
            print(f"Brotli compression failed for {request.url.path}: {e}")
        
        return response
    
    def _get_compression_quality(self, path: str) -> int:
        """Determine compression quality based on path priority"""
        
        # High priority paths (job listings, ONNX models)
        for high_priority_path in self.HIGH_PRIORITY_PATHS:
            if high_priority_path in path:
                # Use best compression for ONNX models and large JSON
                if ".onnx" in path:
                    return self.BROTLI_QUALITY_BEST
                return self.BROTLI_QUALITY_BALANCED
        
        # Default quality for other responses
        return self.default_quality


class OptimizedJSONResponse(JSONResponse):
    """
    Custom JSONResponse with optimized serialization for large payloads
    """
    def __init__(self, content, status_code: int = 200, headers: dict = None, 
                 media_type: str = "application/json", **kwargs):
        
        # Optimize large JSON responses
        if isinstance(content, dict) or isinstance(content, list):
            # Use separators to remove unnecessary whitespace
            # This improves compression ratio by 5-10%
            optimized_content = json.dumps(
                content,
                separators=(',', ':'),
                ensure_ascii=False
            )
        else:
            optimized_content = content
            
        super().__init__(
            content=optimized_content,
            status_code=status_code,
            headers=headers,
            media_type=media_type,
            **kwargs
        )


class CachedBrotliMiddleware(BaseHTTPMiddleware):
    """
    Enhanced middleware with caching for frequently accessed compressed responses
    """
    
    def __init__(self, app: ASGIApp, cache_size: int = 100):
        super().__init__(app)
        self.cache = {}
        self.cache_size = cache_size
        self.cache_hits = 0
        self.cache_misses = 0
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Only cache GET requests
        if request.method != "GET":
            return await call_next(request)
        
        # Create cache key
        cache_key = f"{request.url.path}:{request.headers.get('accept-encoding', '')}"
        
        # Check cache
        if cache_key in self.cache:
            self.cache_hits += 1
            cached_response = self.cache[cache_key]
            # Return cached response
            return Response(
                content=cached_response["body"],
                status_code=cached_response["status_code"],
                headers=cached_response["headers"],
                media_type=cached_response["media_type"]
            )
        
        self.cache_misses += 1
        
        # Get response
        response = await call_next(request)
        
        # Cache compressible responses
        content_type = response.headers.get("content-type", "").split(";")[0]
        if content_type in BrotliCompressionMiddleware.COMPRESSIBLE_TYPES:
            if len(self.cache) >= self.cache_size:
                # Remove oldest entry
                oldest_key = next(iter(self.cache))
                del self.cache[oldest_key]
            
            # Store in cache
            self.cache[cache_key] = {
                "body": response.body,
                "status_code": response.status_code,
                "headers": dict(response.headers),
                "media_type": content_type
            }
        
        return response
    
    def get_cache_stats(self) -> dict:
        """Return cache performance statistics"""
        total = self.cache_hits + self.cache_misses
        hit_rate = (self.cache_hits / total * 100) if total > 0 else 0
        return {
            "hits": self.cache_hits,
            "misses": self.cache_misses,
            "hit_rate": f"{hit_rate:.1f}%",
            "cache_size": len(self.cache)
        }


class BrotliPrecompressMiddleware(BaseHTTPMiddleware):
    """
    Pre-compress static assets and large models at startup
    """
    
    def __init__(self, app: ASGIApp, precompress_paths: list = None):
        super().__init__(app)
        self.precompressed = {}
        
        if precompress_paths is None:
            precompress_paths = [
                "/api/models/intent-ranker.onnx",
                "/api/models/recommender.onnx",
                "/api/models/embeddings.onnx"
            ]
        
        self._precompress_assets(precompress_paths)
    
    def _precompress_assets(self, paths: list):
        """Pre-compress static assets at startup"""
        import os
        import aiofiles
        
        for path in paths:
            # This would load from filesystem in production
            # For now, just mark as ready for pre-compression
            self.precompressed[path] = {
                "compressed": None,
                "original_size": 0,
                "compressed_size": 0
            }
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Check if this path has a pre-compressed version
        if request.url.path in self.precompressed:
            accept_encoding = request.headers.get("accept-encoding", "")
            if "br" in accept_encoding:
                # Serve pre-compressed version
                precompressed_data = self.precompressed[request.url.path]
                if precompressed_data["compressed"]:
                    return Response(
                        content=precompressed_data["compressed"],
                        headers={
                            "content-encoding": "br",
                            "content-type": "application/octet-stream",
                            "x-precompressed": "true"
                        }
                    )
        
        return await call_next(request)


# Middleware for monitoring compression effectiveness
class CompressionMetricsMiddleware(BaseHTTPMiddleware):
    """
    Track compression metrics for performance monitoring
    """
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.metrics = {
            "total_responses": 0,
            "compressed_responses": 0,
            "total_bytes_saved": 0,
            "total_original_bytes": 0,
            "by_path": {}
        }
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        # Record metrics
        self.metrics["total_responses"] += 1
        original_size = len(response.body) if hasattr(response, "body") else 0
        
        if response.headers.get("content-encoding") == "br":
            self.metrics["compressed_responses"] += 1
            compressed_size = int(response.headers.get("content-length", 0))
            bytes_saved = original_size - compressed_size
            
            self.metrics["total_bytes_saved"] += bytes_saved
            self.metrics["total_original_bytes"] += original_size
            
            # Track by path
            path = request.url.path
            if path not in self.metrics["by_path"]:
                self.metrics["by_path"][path] = {
                    "count": 0,
                    "bytes_saved": 0,
                    "original_bytes": 0
                }
            
            self.metrics["by_path"][path]["count"] += 1
            self.metrics["by_path"][path]["bytes_saved"] += bytes_saved
            self.metrics["by_path"][path]["original_bytes"] += original_size
        
        return response
    
    def get_metrics(self) -> dict:
        """Return compression metrics"""
        savings_rate = 0
        if self.metrics["total_original_bytes"] > 0:
            savings_rate = (self.metrics["total_bytes_saved"] / 
                          self.metrics["total_original_bytes"] * 100)
        
        return {
            **self.metrics,
            "compression_rate": f"{(self.metrics['compressed_responses'] / max(1, self.metrics['total_responses']) * 100):.1f}%",
            "bandwidth_savings_mb": self.metrics["total_bytes_saved"] / (1024 * 1024),
            "savings_percentage": f"{savings_rate:.1f}%",
            "by_path": self.metrics["by_path"]
        }


# Export middleware for easy import
__all__ = [
    "BrotliCompressionMiddleware",
    "OptimizedJSONResponse",
    "CachedBrotliMiddleware",
    "BrotliPrecompressMiddleware",
    "CompressionMetricsMiddleware"
]

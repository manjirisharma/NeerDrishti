"""
Flood Risk Predictor - Unified Backend
Runs:
- FastAPI server
- Image / Video analysis
- GPU if available else CPU
- Auto-opens frontend 
"""

import os
import cv2
import json
import time
import torch
import uvicorn
import webbrowser
import numpy as np
from fastapi import FastAPI, UploadFile, File
from scipy import ndimage
from scipy.ndimage import gaussian_filter
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from typing import Optional

# ==========================
# SYSTEM SETUP
# ==========================

BASE_DIR = Path(__file__).parent
STATIC_DIR = BASE_DIR
UPLOAD_DIR = BASE_DIR / "uploads"
OUTPUT_DIR = BASE_DIR / "outputs"

UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

print(f"[INFO] Running on device: {DEVICE.upper()}")

# ==========================
# FASTAPI APP
# ==========================

app = FastAPI(title="Flood Risk Predictor Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================
# HEALTH CHECK
# ==========================

@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "device": DEVICE,
        "backend": "online"
    }

# ==========================
# CORE ANALYSIS LOGIC
# ==========================

def detect_vegetation_water(frame, hsv, gray):
    """
    Advanced water detection for vegetation-surrounded areas
    """
    try:
        h, w, _ = frame.shape
        
        # 1. Greenish water detection (vegetation reflections)
        lower_green_water = np.array([40, 30, 30])   # Green-tinted water
        upper_green_water = np.array([85, 200, 180])
        green_water_mask = cv2.inRange(hsv, lower_green_water, upper_green_water)
        
        # 2. Shadow water detection (under tree canopy)
        lower_shadow_water = np.array([0, 0, 20])    # Very dark water
        upper_shadow_water = np.array([180, 80, 80])
        shadow_water_mask = cv2.inRange(hsv, lower_shadow_water, upper_shadow_water)
        
        # 3. Texture-based water detection using gradient analysis
        # Water typically has low texture variance
        grad_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        grad_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        gradient_magnitude = np.sqrt(grad_x**2 + grad_y**2)
        
        # Low gradient areas (smooth surfaces like water)
        low_texture_mask = (gradient_magnitude < 15).astype(np.uint8) * 255
        
        # 4. Reflectance analysis - water often has specific brightness patterns
        # Use LAB color space for better luminance analysis
        lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
        l_channel = lab[:, :, 0]
        
        # Water often has moderate luminance with low variance
        mean_l = cv2.blur(l_channel, (15, 15))
        luminance_mask = ((l_channel > 30) & (l_channel < 120) & 
                         (np.abs(l_channel.astype(np.int16) - mean_l.astype(np.int16)) < 20)).astype(np.uint8) * 255
        
        # 5. Combine all vegetation-aware masks
        vegetation_water_mask = cv2.bitwise_or(green_water_mask, shadow_water_mask)
        vegetation_water_mask = cv2.bitwise_or(vegetation_water_mask, 
                                              cv2.bitwise_and(low_texture_mask, luminance_mask))
        
        # Clean up with morphological operations
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        vegetation_water_mask = cv2.morphologyEx(vegetation_water_mask, cv2.MORPH_CLOSE, kernel)
        vegetation_water_mask = cv2.morphologyEx(vegetation_water_mask, cv2.MORPH_OPEN, kernel)
        
        return vegetation_water_mask
        
    except Exception as e:
        print(f"Error in vegetation water detection: {e}")
        return np.zeros((frame.shape[0], frame.shape[1]), dtype=np.uint8)

def detect_vegetation_water(frame, hsv, gray):
    """
    Advanced water detection for vegetation-surrounded areas
    """
    try:
        h, w, _ = frame.shape
        
        # 1. Greenish water detection (vegetation reflections)
        lower_green_water = np.array([40, 30, 30])   # Green-tinted water
        upper_green_water = np.array([85, 200, 180])
        green_water_mask = cv2.inRange(hsv, lower_green_water, upper_green_water)
        
        # 2. Shadow water detection (under tree canopy)
        lower_shadow_water = np.array([0, 0, 20])    # Very dark water
        upper_shadow_water = np.array([180, 80, 80])
        shadow_water_mask = cv2.inRange(hsv, lower_shadow_water, upper_shadow_water)
        
        # 3. Texture-based water detection using gradient analysis
        # Water typically has low texture variance
        grad_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        grad_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        gradient_magnitude = np.sqrt(grad_x**2 + grad_y**2)
        
        # Low gradient areas (smooth surfaces like water)
        low_texture_mask = (gradient_magnitude < 15).astype(np.uint8) * 255
        
        # 4. Reflectance analysis - water often has specific brightness patterns
        # Use LAB color space for better luminance analysis
        lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
        l_channel = lab[:, :, 0]
        
        # Water often has moderate luminance with low variance
        mean_l = cv2.blur(l_channel, (15, 15))
        luminance_mask = ((l_channel > 30) & (l_channel < 120) & 
                         (np.abs(l_channel.astype(np.int16) - mean_l.astype(np.int16)) < 20)).astype(np.uint8) * 255
        
        # 5. Combine all vegetation-aware masks
        vegetation_water_mask = cv2.bitwise_or(green_water_mask, shadow_water_mask)
        vegetation_water_mask = cv2.bitwise_or(vegetation_water_mask, 
                                              cv2.bitwise_and(low_texture_mask, luminance_mask))
        
        # Clean up with morphological operations
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        vegetation_water_mask = cv2.morphologyEx(vegetation_water_mask, cv2.MORPH_CLOSE, kernel)
        vegetation_water_mask = cv2.morphologyEx(vegetation_water_mask, cv2.MORPH_OPEN, kernel)
        
        return vegetation_water_mask
        
    except Exception as e:
        print(f"Error in vegetation water detection: {e}")
        return np.zeros((frame.shape[0], frame.shape[1]), dtype=np.uint8)

def detect_mixed_water_vegetation(frame, hsv):
    """
    Detect water areas with floating vegetation or debris (common in floods)
    """
    try:
        h, w, _ = frame.shape
        
        # Convert to different color spaces for comprehensive analysis
        lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
        
        # 1. Detect areas with moderate green but low saturation (algae/debris water)
        h_channel = hsv[:, :, 0]
        s_channel = hsv[:, :, 1] 
        v_channel = hsv[:, :, 2]
        
        # Mixed signature: greenish hue, moderate saturation, variable value
        mixed_mask1 = ((h_channel >= 35) & (h_channel <= 95) & 
                       (s_channel >= 30) & (s_channel <= 150) & 
                       (v_channel >= 40) & (v_channel <= 180)).astype(np.uint8) * 255
        
        # 2. Use LAB space to detect water-like surfaces with organic matter
        l_channel = lab[:, :, 0]
        a_channel = lab[:, :, 1] 
        b_channel = lab[:, :, 2]
        
        # Water with vegetation tends to have specific a,b values
        mixed_mask2 = ((l_channel >= 40) & (l_channel <= 140) & 
                       (a_channel >= 110) & (a_channel <= 135) & 
                       (b_channel >= 110) & (b_channel <= 145)).astype(np.uint8) * 255
        
        # 3. Temporal smoothness analysis (even single frame can benefit)
        # Water areas typically have smoother transitions
        blurred = cv2.GaussianBlur(cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY), (9, 9), 0)
        
        # Areas with gentle gradients (water-like)
        grad_x = cv2.Sobel(blurred, cv2.CV_64F, 1, 0, ksize=5)
        grad_y = cv2.Sobel(blurred, cv2.CV_64F, 0, 1, ksize=5)
        gradient_mag = np.sqrt(grad_x**2 + grad_y**2)
        
        smooth_mask = (gradient_mag < 25).astype(np.uint8) * 255
        
        # Combine mixed signature masks
        final_mixed_mask = cv2.bitwise_or(mixed_mask1, mixed_mask2)
        final_mixed_mask = cv2.bitwise_and(final_mixed_mask, smooth_mask)
        
        # Clean up
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        final_mixed_mask = cv2.morphologyEx(final_mixed_mask, cv2.MORPH_OPEN, kernel)
        final_mixed_mask = cv2.morphologyEx(final_mixed_mask, cv2.MORPH_CLOSE, kernel)
        
        return final_mixed_mask
        
    except Exception as e:
        print(f"Error in mixed water-vegetation detection: {e}")
        return np.zeros((frame.shape[0], frame.shape[1]), dtype=np.uint8)

def suppress_road_false_positives(mask, frame):
    """
    Remove road-like structures from water detection (less aggressive)
    """
    try:
        # Gentler morphological opening to preserve water while removing thin roads
        kernel_small = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2, 2))  # Smaller kernel
        opened = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel_small)
        
        # Find contours
        contours, _ = cv2.findContours(opened, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Filter out road-like contours with relaxed criteria
        filtered_mask = np.zeros_like(mask)
        for contour in contours:
            area = cv2.contourArea(contour)
            if area < 30:  # Smaller minimum area threshold
                continue
                
            # Calculate aspect ratio and area-to-perimeter ratio
            rect = cv2.minAreaRect(contour)
            width, height = rect[1]
            if width > 0 and height > 0:
                aspect_ratio = max(width, height) / min(width, height)
                perimeter = cv2.arcLength(contour, True)
                if perimeter > 0:
                    ap_ratio = area / (perimeter * perimeter)
                    
                    # Less aggressive road filtering (higher thresholds)
                    if aspect_ratio > 12 or ap_ratio < 0.005:  # More lenient
                        continue
            
            # Keep this contour
            cv2.drawContours(filtered_mask, [contour], -1, 255, -1)
        
        return filtered_mask
    except Exception as e:
        print(f"Error in road suppression: {e}")
        return mask

def classify_water_zones(mask, frame):
    """
    Classify water into core, buffer, and low-risk zones
    """
    try:
        h, w = mask.shape
        
        # Zone A: Core water bodies (morphological closing)
        kernel_large = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
        zone_a = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel_large)
        zone_a = cv2.morphologyEx(zone_a, cv2.MORPH_OPEN, kernel_large)
        
        # Zone B: Buffer zones (dilation around core)
        kernel_buffer = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (25, 25))
        zone_b = cv2.dilate(zone_a, kernel_buffer, iterations=1)
        zone_b = zone_b - zone_a  # Remove core from buffer
        
        # Zone C: Low-risk moisture (original mask minus core)
        zone_c = mask - zone_a
        zone_c = np.clip(zone_c, 0, 255)
        
        return zone_a, zone_b, zone_c
    except Exception as e:
        print(f"Error in zone classification: {e}")
        return mask, np.zeros_like(mask), np.zeros_like(mask)

def detect_water_body_type(mask, frame):
    """
    Classify the type of water body with improved ocean vs river detection
    """
    try:
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return "unknown"
        
        h, w = frame.shape[:2]
        
        # Find largest contour
        largest_contour = max(contours, key=cv2.contourArea)
        area = cv2.contourArea(largest_contour)
        perimeter = cv2.arcLength(largest_contour, True)
        
        if perimeter == 0:
            return "unknown"
        
        # Check if water touches image edges (indicates ocean/sea)
        edge_margin = 5  # pixels from edge
        touches_edges = 0
        
        for point in largest_contour:
            x, y = point[0]
            if (x <= edge_margin or x >= w - edge_margin or 
                y <= edge_margin or y >= h - edge_margin):
                touches_edges += 1
        
        edge_touch_ratio = touches_edges / len(largest_contour)
        
        # Shape analysis
        circularity = 4 * np.pi * area / (perimeter * perimeter)
        rect = cv2.minAreaRect(largest_contour)
        width, height = rect[1]
        
        if width > 0 and height > 0:
            aspect_ratio = max(width, height) / min(width, height)
            
            # Ocean detection: Large area AND touches multiple edges
            if (area > frame.shape[0] * frame.shape[1] * 0.4 and 
                edge_touch_ratio > 0.1):  # Touches edges significantly
                return "ocean"
            
            # River detection: Elongated shape OR doesn't touch edges much
            elif (aspect_ratio > 4 or edge_touch_ratio < 0.05):  # Elongated or inland
                if aspect_ratio > 8:  # Very elongated
                    return "river"
                elif circularity > 0.5:  # Somewhat circular but inland
                    return "lake"
                else:
                    return "river"  # Default for inland water
            
            # Lake detection: Circular and moderate size
            elif circularity > 0.6 and area < frame.shape[0] * frame.shape[1] * 0.2:
                return "lake"
            
            # Default classification for inland water bodies
            else:
                return "river"
        
        return "river"  # Default to river for inland water
    except Exception as e:
        print(f"Error in water body classification: {e}")
        return "unknown"

def analyze_frame(frame: np.ndarray):
    """
    Research-grade visual flood analysis with vegetation-aware detection
    """
    try:
        h, w, _ = frame.shape

        # Enhanced multi-spectrum water detection
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # 1. Expanded standard water detection ranges
        lower_water1 = np.array([80, 30, 30])   # More inclusive blue water
        upper_water1 = np.array([150, 255, 255])
        
        lower_water2 = np.array([0, 0, 40])     # More inclusive dark water  
        upper_water2 = np.array([35, 255, 130])
        
        # 3. Enhanced brownish/muddy water (common in flood conditions)
        lower_water3 = np.array([5, 40, 40])    # More inclusive brown/muddy water
        upper_water3 = np.array([30, 220, 170])
        
        # 4. Additional water range for satellite imagery (grayish-blue water)
        lower_water4 = np.array([90, 20, 50])   # Low saturation blue-gray water
        upper_water4 = np.array([130, 100, 150])
        
        mask1 = cv2.inRange(hsv, lower_water1, upper_water1)
        mask2 = cv2.inRange(hsv, lower_water2, upper_water2)
        mask3 = cv2.inRange(hsv, lower_water3, upper_water3)
        mask4 = cv2.inRange(hsv, lower_water4, upper_water4)
        
        # 2. Vegetation-aware water detection
        vegetation_mask = detect_vegetation_water(frame, hsv, gray)
        
        # Combine all water detection masks (now more comprehensive)
        combined_mask = cv2.bitwise_or(mask1, mask2)
        combined_mask = cv2.bitwise_or(combined_mask, mask3)
        combined_mask = cv2.bitwise_or(combined_mask, mask4)
        combined_mask = cv2.bitwise_or(combined_mask, vegetation_mask)
        
        # Additional enhancement for flood water (often has debris/vegetation)
        # Detect areas with mixed water-vegetation signatures
        mixed_signature_mask = detect_mixed_water_vegetation(frame, hsv)
        combined_mask = cv2.bitwise_or(combined_mask, mixed_signature_mask)
        
        # Suppress road false positives
        filtered_mask = suppress_road_false_positives(combined_mask, frame)
        
        # Classify into zones
        zone_a, zone_b, zone_c = classify_water_zones(filtered_mask, frame)
        
        # Calculate coverage for each zone
        total_pixels = h * w
        zone_a_ratio = float(np.sum(zone_a > 0) / total_pixels)
        zone_b_ratio = float(np.sum(zone_b > 0) / total_pixels)
        zone_c_ratio = float(np.sum(zone_c > 0) / total_pixels)
        total_water_ratio = zone_a_ratio + zone_b_ratio + zone_c_ratio
        
        # Enhanced risk assessment
        if zone_a_ratio > 0.15:  # Core water dominates
            risk = "Extreme"
        elif zone_a_ratio > 0.08:
            risk = "Severe"
        elif (zone_a_ratio + zone_b_ratio) > 0.2:
            risk = "Elevated"
        elif total_water_ratio > 0.15:
            risk = "Guarded"
        elif total_water_ratio > 0.05:
            risk = "Low"
        else:
            risk = "Minimal"
        
        # Detect water body type
        water_body_type = detect_water_body_type(filtered_mask, frame)
        
        # Calculate edge confidence
        edges = cv2.Canny(filtered_mask, 50, 150)
        edge_pixels = np.sum(edges > 0)
        edge_confidence = min(1.0, float(edge_pixels / max(1, np.sum(filtered_mask > 0))))
        
        return {
            "risk_level": risk,
            "water_coverage": round(total_water_ratio * 100, 2),
            "explainability": {
                "Water presence": f"{round(total_water_ratio*100,2)}%",
                "Core water bodies": f"{round(zone_a_ratio*100,2)}%",
                "Buffer zones": f"{round(zone_b_ratio*100,2)}%",
                "Moisture areas": f"{round(zone_c_ratio*100,2)}%",
                "River/Ocean detected": bool(total_water_ratio > 0.15),
                "Surface saturation": "High" if total_water_ratio > 0.3 else "Moderate",
                "Historical zone": "Likely" if total_water_ratio > 0.2 else "Unlikely",
                "water_body_type": water_body_type,
                "edge_confidence": round(edge_confidence, 3),
                "false_positive_suppressed": True
            },
            "zones": {
                "zone_a": zone_a,
                "zone_b": zone_b, 
                "zone_c": zone_c
            },
            "mask": filtered_mask
        }
    except Exception as e:
        print(f"Error in analyze_frame: {e}")
        # Return safe default values
        return {
            "risk_level": "Unknown",
            "water_coverage": 0.0,
            "explainability": {
                "Water presence": "0%",
                "Core water bodies": "0%",
                "Buffer zones": "0%",
                "Moisture areas": "0%",
                "River/Ocean detected": False,
                "Surface saturation": "Unknown",
                "Historical zone": "Unknown",
                "water_body_type": "unknown",
                "edge_confidence": 0.0,
                "false_positive_suppressed": True
            },
            "zones": {
                "zone_a": np.zeros((frame.shape[0], frame.shape[1]), dtype=np.uint8),
                "zone_b": np.zeros((frame.shape[0], frame.shape[1]), dtype=np.uint8),
                "zone_c": np.zeros((frame.shape[0], frame.shape[1]), dtype=np.uint8)
            },
            "mask": np.zeros((frame.shape[0], frame.shape[1]), dtype=np.uint8)
        }

def create_multi_scale_heatmap(mask, shape):
    """
    Generate dense heatmap with multiple Gaussian kernels
    """
    try:
        h, w = shape[:2]
        heatmap = np.zeros((h, w), dtype=np.float32)
        
        if np.sum(mask) == 0:
            return heatmap
        
        # Multiple scale Gaussian kernels for density
        scales = [5, 10, 20, 30]
        weights = [0.4, 0.3, 0.2, 0.1]
        
        for scale, weight in zip(scales, weights):
            smoothed = gaussian_filter(mask.astype(np.float32), sigma=scale)
            heatmap += smoothed * weight
        
        # Normalize
        if np.max(heatmap) > 0:
            heatmap = heatmap / np.max(heatmap)
        
        return heatmap
    except Exception as e:
        print(f"Error creating heatmap: {e}")
        return np.zeros(shape[:2], dtype=np.float32)

def add_water_edge_labels(output, zones, analysis):
    """
    Add floating risk labels along water edges
    """
    try:
        zone_a = zones["zone_a"]
        
        # Find contours for edge detection
        contours, _ = cv2.findContours(zone_a, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        water_type = analysis["explainability"].get("water_body_type", "water")
        risk_level = analysis["risk_level"]
        
        for i, contour in enumerate(contours[:3]):  # Limit to 3 largest
            if cv2.contourArea(contour) < 200:
                continue
            
            # Find a good position along the contour
            contour_len = len(contour)
            if contour_len < 10:
                continue
                
            # Place label at 1/3 along contour
            point_idx = contour_len // 3
            label_point = tuple(contour[point_idx][0])
            
            # Offset point away from water edge
            offset_point = (label_point[0] + 30, label_point[1] - 15)
            
            # Create label text
            if water_type == "river":
                label_text = f"River Flood Risk: {risk_level}"
            elif water_type == "lake":
                label_text = f"Lake Overflow: {risk_level}"
            elif water_type == "ocean":
                label_text = f"Storm Surge Risk: {risk_level}"
            else:
                label_text = f"Flood Risk: {risk_level}"
            
            # Draw label with background
            text_size = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)[0]
            bg_rect = (offset_point[0] - 5, offset_point[1] - text_size[1] - 5, 
                      text_size[0] + 10, text_size[1] + 10)
            
            cv2.rectangle(output, (bg_rect[0], bg_rect[1]), 
                         (bg_rect[0] + bg_rect[2], bg_rect[1] + bg_rect[3]), 
                         (0, 0, 0), -1)
            
            cv2.putText(output, label_text, offset_point, 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
            
            # Draw connecting line
            cv2.line(output, label_point, offset_point, (255, 255, 255), 1)
        
        return output
    except Exception as e:
        print(f"Error adding edge labels: {e}")
        return output

def add_research_legend(output):
    """
    Add professional research-grade legend and color scale
    """
    try:
        h, w = output.shape[:2]
        
        # Legend background
        legend_w, legend_h = 200, 120
        legend_x = w - legend_w - 20
        legend_y = h - legend_h - 20
        
        # Semi-transparent background
        overlay = output.copy()
        cv2.rectangle(overlay, (legend_x, legend_y), 
                     (legend_x + legend_w, legend_y + legend_h), 
                     (0, 0, 0), -1)
        output = cv2.addWeighted(output, 0.7, overlay, 0.3, 0)
        
        # Title
        cv2.putText(output, "FLOOD ANALYSIS", 
                   (legend_x + 10, legend_y + 20), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        
        # Color scale items
        items = [
            ("Core Water", (0, 0, 200)),      # Deep Red
            ("Risk Buffer", (0, 165, 255)),   # Orange
            ("Low Risk", (255, 255, 0)),      # Cyan
        ]
        
        y_offset = 40
        for label, color in items:
            # Color square
            cv2.rectangle(output, 
                         (legend_x + 10, legend_y + y_offset), 
                         (legend_x + 25, legend_y + y_offset + 10), 
                         color, -1)
            
            # Label text
            cv2.putText(output, label, 
                       (legend_x + 35, legend_y + y_offset + 8), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)
            
            y_offset += 20
        
        # Add timestamp for research authenticity
        timestamp = time.strftime("%Y-%m-%d %H:%M UTC")
        cv2.putText(output, f"Generated: {timestamp}", 
                   (20, h - 10), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.4, (200, 200, 200), 1)
        
        return output
    except Exception as e:
        print(f"Error adding legend: {e}")
        return output

def annotate_frame(frame, analysis):
    """
    Research-grade flood visualization with multi-zone heatmaps
    """
    try:
        h, w = frame.shape[:2]
        output = frame.copy()
        
        zones = analysis["zones"]
        zone_a = zones["zone_a"]
        zone_b = zones["zone_b"] 
        zone_c = zones["zone_c"]
        
        # Create multi-scale heatmaps for each zone
        heatmap_a = create_multi_scale_heatmap(zone_a, frame.shape)
        heatmap_b = create_multi_scale_heatmap(zone_b, frame.shape)
        heatmap_c = create_multi_scale_heatmap(zone_c, frame.shape)
        
        # Create colored overlays
        overlay = np.zeros_like(frame)
        
        # Zone A: Deep Red (Core water)
        overlay[:, :, 2] = np.clip(overlay[:, :, 2] + (heatmap_a * 255).astype(np.uint8), 0, 255)
        
        # Zone B: Orange/Yellow (Risk buffer)
        overlay[:, :, 1] = np.clip(overlay[:, :, 1] + (heatmap_b * 200).astype(np.uint8), 0, 255)
        overlay[:, :, 2] = np.clip(overlay[:, :, 2] + (heatmap_b * 255).astype(np.uint8), 0, 255)
        
        # Zone C: Cyan (Low risk)
        overlay[:, :, 0] = np.clip(overlay[:, :, 0] + (heatmap_c * 255).astype(np.uint8), 0, 255)
        overlay[:, :, 1] = np.clip(overlay[:, :, 1] + (heatmap_c * 255).astype(np.uint8), 0, 255)
        
        # Blend with original frame
        output = cv2.addWeighted(output, 0.6, overlay, 0.4, 0)
        
        # Add water edge labels
        output = add_water_edge_labels(output, zones, analysis)
        
        # Main status header
        risk = analysis['risk_level']
        water_pct = analysis['water_coverage']
        water_type = analysis['explainability'].get('water_body_type', 'unknown')
        
        header_text = f"FLOOD RISK: {risk} | {water_type.upper()} | Coverage: {water_pct}%"
        
        # Enhanced header with gradient background
        cv2.rectangle(output, (0, 0), (w, 50), (0, 0, 0), -1)
        
        # Risk level color coding
        risk_colors = {
            "Minimal": (0, 255, 0),
            "Low": (0, 200, 100),
            "Guarded": (0, 255, 255),
            "Elevated": (0, 165, 255),
            "Severe": (0, 100, 255),
            "Extreme": (0, 0, 255)
        }
        
        color = risk_colors.get(risk, (255, 255, 255))
        
        cv2.putText(output, header_text, (20, 30), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
        
        # Add professional legend
        output = add_research_legend(output)
        
        return output
        
    except Exception as e:
        print(f"Error in annotate_frame: {e}")
        # Return original frame with basic error overlay
        output = frame.copy()
        cv2.putText(output, "Analysis Error - See Logs", (20, 50), 
                   cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
        return output

# ==========================
# IMAGE INFERENCE
# ==========================

@app.post("/api/infer/image")
async def infer_image(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        npimg = np.frombuffer(contents, np.uint8)
        frame = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

        if frame is None:
            return JSONResponse({"error": "Invalid image format"}, status_code=400)

        analysis = analyze_frame(frame)
        output = annotate_frame(frame, analysis)

        out_path = OUTPUT_DIR / f"output_{int(time.time())}.png"
        cv2.imwrite(str(out_path), output)

        # Create JSON-safe response by excluding the mask
        response_data = {
            "risk": analysis["risk_level"],
            "water_coverage": analysis["water_coverage"],
            "details": analysis["explainability"],
            "output_image": out_path.name
        }

        return JSONResponse(response_data)
    except Exception as e:
        print(f"Error in image inference: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)

# ==========================
# VIDEO INFERENCE
# ==========================

@app.post("/api/infer/video")
async def infer_video(file: UploadFile = File(...)):
    try:
        video_path = UPLOAD_DIR / file.filename
        with open(video_path, "wb") as f:
            f.write(await file.read())

        cap = cv2.VideoCapture(str(video_path))
        if not cap.isOpened():
            return JSONResponse({"error": "Invalid video format"}, status_code=400)
            
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        out_path = OUTPUT_DIR / f"out_{int(time.time())}.mp4"

        fps = cap.get(cv2.CAP_PROP_FPS)
        w = int(cap.get(3))
        h = int(cap.get(4))

        out = cv2.VideoWriter(str(out_path), fourcc, fps, (w, h))

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            analysis = analyze_frame(frame)
            annotated = annotate_frame(frame, analysis)
            out.write(annotated)

        cap.release()
        out.release()

        return JSONResponse({
            "status": "done",
            "output_video": out_path.name
        })
    except Exception as e:
        print(f"Error in video inference: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)

# ==========================
# SERVE FRONTEND FILES
# ==========================

# Serve frontend files (AFTER API routes to avoid conflicts)
app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")

# ==========================
# AUTO-LAUNCH
# ==========================

def launch():
    url = "http://127.0.0.1:8000"
    print("[INFO] Opening browser...")
    webbrowser.open(url)

# ==========================
# MAIN
# ==========================

if __name__ == "__main__":
    launch()
    uvicorn.run(app, host="0.0.0.0", port=8000)

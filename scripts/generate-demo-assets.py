"""
Generate high-fidelity README visual assets for Prayer Reminder.
Creates:
- demo/images/cover.png (2560x1280 social preview banner)
- demo/images/demo.gif (optimized animated walkthrough)
- demo/images/home-auto.png (framed showcase)
- demo/images/manual-editor.png (framed showcase)
- demo/images/offset-modal.png (framed showcase)
- demo/images/settings-screen.png (framed showcase)
"""

import os
import sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import cv2

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DEMO_DIR = os.path.join(ROOT_DIR, "demo", "images")
ASSETS_DIR = os.path.join(ROOT_DIR, "assets")

os.makedirs(DEMO_DIR, exist_ok=True)

def get_font(size=24, bold=False):
    # Try system fonts on Windows
    font_names = [
        "segoeui.ttf", "segoeuib.ttf" if bold else "segoeui.ttf",
        "arial.ttf", "arialbd.ttf" if bold else "arial.ttf",
        "calibri.ttf"
    ]
    font_dir = r"C:\Windows\Fonts"
    target = "segoeuib.ttf" if bold else "segoeui.ttf"
    full_path = os.path.join(font_dir, target)
    if os.path.exists(full_path):
        try:
            return ImageFont.truetype(full_path, size)
        except Exception:
            pass
    for fn in font_names:
        fp = os.path.join(font_dir, fn)
        if os.path.exists(fp):
            try:
                return ImageFont.truetype(fp, size)
            except Exception:
                pass
    return ImageFont.load_default()

def add_phone_frame(screen_img, title=""):
    """
    Renders the phone screenshot inside a polished, modern device chassis
    with rounded corners, bezel, speaker/camera notch, and drop shadow.
    """
    target_w, target_h = screen_img.size
    
    # Scale screenshot to fit standard phone frame proportion
    base_w = 400
    ratio = base_w / float(target_w)
    base_h = int(target_h * ratio)
    screen_resized = screen_img.resize((base_w, base_h), Image.Resampling.LANCZOS)
    
    # Add rounded corners to screen
    screen_radius = 28
    mask = Image.new("L", (base_w, base_h), 0)
    draw_mask = ImageDraw.Draw(mask)
    draw_mask.rounded_rectangle([0, 0, base_w, base_h], radius=screen_radius, fill=255)
    
    # Device frame dimensions
    bezel = 12
    phone_w = base_w + bezel * 2
    phone_h = base_h + bezel * 2
    
    phone_img = Image.new("RGBA", (phone_w, phone_h), (0, 0, 0, 0))
    pdraw = ImageDraw.Draw(phone_img)
    
    # Outer chassis
    outer_radius = screen_radius + bezel
    pdraw.rounded_rectangle(
        [0, 0, phone_w - 1, phone_h - 1],
        radius=outer_radius,
        fill=(26, 26, 30, 255),
        outline=(55, 55, 65, 255),
        width=2
    )
    
    # Inner rim
    pdraw.rounded_rectangle(
        [bezel - 1, bezel - 1, phone_w - bezel, phone_h - bezel],
        radius=screen_radius + 1,
        outline=(15, 15, 18, 255),
        width=2
    )
    
    # Paste screen
    phone_img.paste(screen_resized, (bezel, bezel), mask)
    
    # Dynamic Island / Camera hole
    notch_w, notch_h = 100, 18
    notch_x = (phone_w - notch_w) // 2
    notch_y = bezel + 6
    pdraw.rounded_rectangle(
        [notch_x, notch_y, notch_x + notch_w, notch_y + notch_h],
        radius=9,
        fill=(0, 0, 0, 255)
    )
    # Camera lens reflection
    pdraw.ellipse(
        [notch_x + notch_w - 22, notch_y + 4, notch_x + notch_w - 12, notch_y + 14],
        fill=(15, 20, 35, 255)
    )
    
    # Add drop shadow on presentation canvas
    padding_x = 40
    padding_y = 40
    canvas_w = phone_w + padding_x * 2
    canvas_h = phone_h + padding_y * 2
    
    canvas = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    
    # Shadow layer
    shadow = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    sdraw.rounded_rectangle(
        [padding_x + 8, padding_y + 16, padding_x + phone_w + 8, padding_y + phone_h + 16],
        radius=outer_radius,
        fill=(0, 0, 0, 180)
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(24))
    
    canvas.paste(shadow, (0, 0), shadow)
    canvas.paste(phone_img, (padding_x, padding_y), phone_img)
    
    return canvas

def create_showcase_card(screen_img, label=""):
    """
    Creates a high-resolution dark slate presentation card with the phone mockup.
    """
    framed = add_phone_frame(screen_img)
    fw, fh = framed.size
    
    card_w = fw + 60
    card_h = fh + 60
    card = Image.new("RGBA", (card_w, card_h), (14, 14, 18, 255))
    cdraw = ImageDraw.Draw(card)
    
    # Subtle border
    cdraw.rounded_rectangle(
        [0, 0, card_w - 1, card_h - 1],
        radius=24,
        outline=(35, 35, 45, 255),
        width=2
    )
    
    # Paste phone centered
    px = (card_w - fw) // 2
    py = (card_h - fh) // 2
    card.paste(framed, (px, py), framed)
    
    return card

def convert_mp4_to_gif(mp4_path, gif_path, target_width=380, fps_step=2):
    """
    Reads an MP4 file and outputs an optimized GIF with palette quantization.
    """
    if not os.path.exists(mp4_path):
        print(f"Warning: {mp4_path} not found.")
        return False
        
    cap = cv2.VideoCapture(mp4_path)
    frames = []
    frame_idx = 0
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        frame_idx += 1
        # Skip frames to reduce frame count and keep GIF lightweight
        if frame_idx % fps_step != 0:
            continue
            
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        pil_img = Image.fromarray(rgb)
        
        # Resize
        w, h = pil_img.size
        ratio = target_width / float(w)
        new_h = int(h * ratio)
        pil_img = pil_img.resize((target_width, new_h), Image.Resampling.LANCZOS)
        
        frames.append(pil_img)
        
    cap.release()
    
    if not frames:
        print("No frames extracted from video.")
        return False
        
    print(f"Extracted {len(frames)} frames. Generating optimized GIF...")
    # Quantize palette
    quantized_frames = []
    for f in frames:
        # Convert to P mode with adaptive palette
        q = f.convert("P", palette=Image.Palette.ADAPTIVE, colors=128)
        quantized_frames.append(q)
        
    # Save GIF
    quantized_frames[0].save(
        gif_path,
        save_all=True,
        append_images=quantized_frames[1:],
        optimize=True,
        duration=66, # ~15 fps
        loop=0
    )
    print(f"GIF saved to {gif_path} (size: {os.path.getsize(gif_path) / (1024*1024):.2f} MB)")
    return True

def generate_cover_banner(home_screen_path, settings_screen_path, output_path):
    """
    Composes the 2560x1280 header cover banner matching DontShowMe styling.
    """
    width, height = 2560, 1280
    bg = Image.new("RGBA", (width, height), (10, 10, 12, 255))
    draw = ImageDraw.Draw(bg)
    
    # 1. Subtle Radial / Gradient Glow in background
    glow = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    
    # Indigo radial aura on left
    gdraw.ellipse([200, 200, 1200, 1200], fill=(99, 102, 241, 45))
    # Violet secondary aura on right
    gdraw.ellipse([1400, 300, 2400, 1300], fill=(139, 92, 246, 35))
    glow = glow.filter(ImageFilter.GaussianBlur(120))
    bg.paste(glow, (0, 0), glow)
    
    # 2. Grid lines subtle overlay
    grid = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    grdraw = ImageDraw.Draw(grid)
    for x in range(0, width, 80):
        grdraw.line([(x, 0), (x, height)], fill=(255, 255, 255, 6), width=1)
    for y in range(0, height, 80):
        grdraw.line([(0, y), (width, y)], fill=(255, 255, 255, 6), width=1)
    bg.paste(grid, (0, 0), grid)
    
    # 3. Left Side: Brand Typography & Badges
    icon_path = os.path.join(ASSETS_DIR, "icon.png")
    if os.path.exists(icon_path):
        icon_img = Image.open(icon_path).convert("RGBA")
        icon_size = 180
        icon_img = icon_img.resize((icon_size, icon_size), Image.Resampling.LANCZOS)
        
        # Round icon corners
        imask = Image.new("L", (icon_size, icon_size), 0)
        idraw = ImageDraw.Draw(imask)
        idraw.rounded_rectangle([0, 0, icon_size, icon_size], radius=40, fill=255)
        
        # Icon shadow
        ishadow = Image.new("RGBA", (icon_size + 40, icon_size + 40), (0, 0, 0, 0))
        isdraw = ImageDraw.Draw(ishadow)
        isdraw.rounded_rectangle([20, 20, icon_size + 20, icon_size + 20], radius=40, fill=(99, 102, 241, 140))
        ishadow = ishadow.filter(ImageFilter.GaussianBlur(25))
        
        bg.paste(ishadow, (140, 190), ishadow)
        bg.paste(icon_img, (160, 210), imask)
        
    font_title = get_font(size=82, bold=True)
    font_sub = get_font(size=36, bold=False)
    font_badge = get_font(size=22, bold=True)
    
    # Title
    draw.text((160, 440), "Prayer Reminder", font=font_title, fill=(248, 250, 252, 255))
    
    # Accent indicator
    accent_bar = Image.new("RGBA", (140, 8), (99, 102, 241, 255))
    bg.paste(accent_bar, (160, 550), accent_bar)
    
    # Subtitle
    subtitle_lines = [
        "Precision Islamic Prayer Times with Granular Offsets,",
        "Custom Manual Modes & Authentic Heads-Up Alarms",
        "100% On-Device Calculations • Zero Telemetry • Ad-Free"
    ]
    cur_y = 580
    for line in subtitle_lines:
        draw.text((160, cur_y), line, font=font_sub, fill=(148, 163, 184, 255))
        cur_y += 50
        
    # Feature Badge Pills
    badges = [
        ("100% Offline Math", (99, 102, 241)),
        ("Custom Minute Offsets", (16, 185, 129)),
        ("Dual Auto/Manual Modes", (59, 130, 246)),
        ("Native Alarm Audio", (245, 158, 11)),
        ("React Native & Expo 56", (168, 85, 247))
    ]
    
    pill_x = 160
    pill_y = 770
    for text, color in badges:
        # Measure text size
        bbox = draw.textbbox((0, 0), text, font=font_badge)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        pw = tw + 40
        ph = 48
        
        # If wrap needed
        if pill_x + pw > 1250:
            pill_x = 160
            pill_y += 64
            
        # Draw pill
        pill = Image.new("RGBA", (pw, ph), (0, 0, 0, 0))
        pdraw = ImageDraw.Draw(pill)
        pdraw.rounded_rectangle(
            [0, 0, pw - 1, ph - 1],
            radius=24,
            fill=(*color, 35),
            outline=(*color, 140),
            width=2
        )
        pdraw.text((20, (ph - th) // 2 - 2), text, font=font_badge, fill=(240, 245, 255, 255))
        bg.paste(pill, (pill_x, pill_y), pill)
        pill_x += pw + 18
        
    # 4. Right Side: Dual Angled / Overlapping Mobile Mockups
    if os.path.exists(home_screen_path):
        home_img = Image.open(home_screen_path).convert("RGBA")
        home_framed = add_phone_frame(home_img)
        
        # Scale to fit cover composition
        h_ratio = 1000 / float(home_framed.size[1])
        new_w = int(home_framed.size[0] * h_ratio)
        home_framed = home_framed.resize((new_w, 1000), Image.Resampling.LANCZOS)
        
        # If settings screen also exists, place both overlapping
        if os.path.exists(settings_screen_path):
            sett_img = Image.open(settings_screen_path).convert("RGBA")
            sett_framed = add_phone_frame(sett_img)
            sett_framed = sett_framed.resize((new_w, 1000), Image.Resampling.LANCZOS)
            
            # Paste settings behind slightly to the right
            bg.paste(sett_framed, (1900, 180), sett_framed)
            # Paste home in front slightly to the left
            bg.paste(home_framed, (1420, 120), home_framed)
        else:
            bg.paste(home_framed, (1600, 140), home_framed)
            
    # Save finished cover
    bg = bg.convert("RGB")
    bg.save(output_path, quality=95)
    print(f"Cover banner saved to {output_path}")

if __name__ == "__main__":
    print("Script ready. Can be called with commands or imported.")

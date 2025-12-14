
try:
    import imageio_ffmpeg
    print(f"ImageIO FFmpeg: {imageio_ffmpeg.get_ffmpeg_exe()}")
except ImportError:
    print("imageio_ffmpeg not found")

try:
    from moviepy.config import get_setting
    print(f"MoviePy FFmpeg: {get_setting('FFMPEG_BINARY')}")
except Exception as e:
    print(f"MoviePy Error: {e}")

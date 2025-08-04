from pathlib import Path
import shutil

from app.utils.logging import setup_logger

logger = setup_logger(__name__)

def cleanup_temp_files(audio_file_path: Path, temp_dir: Path):
    """Clean up temporary files and directories."""
    try:
        # Remove the audio file if it exists
        if audio_file_path.exists():
            audio_file_path.unlink()
            logger.info(f"Removed audio file: {audio_file_path}")
        
        # Remove the temporary directory if it exists and is empty or contains only temp files
        if temp_dir.exists():
            # Check if directory is empty or only contains related temp files
            remaining_files = list(temp_dir.glob('*'))
            if not remaining_files:
                temp_dir.rmdir()
                logger.info(f"Removed empty temp directory: {temp_dir}")
            else:
                # Only remove if all remaining files are temp files for this video
                video_id = audio_file_path.stem.replace('temp_audio_', '')
                if all(video_id in f.name for f in remaining_files):
                    shutil.rmtree(temp_dir)
                    logger.info(f"Removed temp directory with related files: {temp_dir}")
    except Exception as e:
        logger.warning(f"Error cleaning up temp files: {e}")
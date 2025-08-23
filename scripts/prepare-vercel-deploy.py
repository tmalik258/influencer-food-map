#!/usr/bin/env python3
"""
Vercel Deployment Preparation Script

This script helps prepare the project for Vercel deployment by:
1. Validating required files exist
2. Checking environment variables
3. Providing deployment checklist
"""

import os
import sys
from pathlib import Path

def check_file_exists(file_path, description):
    """Check if a required file exists."""
    if Path(file_path).exists():
        print(f"✅ {description}: {file_path}")
        return True
    else:
        print(f"❌ {description}: {file_path} (MISSING)")
        return False

def check_deployment_files():
    """Check if all deployment files are present."""
    print("🔍 Checking deployment files...")
    
    required_files = [
        ("vercel.json", "Vercel configuration"),
        ("requirements.txt", "Python dependencies (root)"),
        ("api/index.py", "API entry point"),
        ("frontend/package.json", "Frontend package.json"),
        ("frontend/next.config.ts", "Next.js configuration"),
        ("backend/app/main.py", "FastAPI main application"),
        ("DEPLOYMENT.md", "Deployment documentation"),
        ("VERCEL_ENV_VARS.md", "Environment variables guide"),
    ]
    
    all_present = True
    for file_path, description in required_files:
        if not check_file_exists(file_path, description):
            all_present = False
    
    return all_present

def check_env_template():
    """Check if environment template exists."""
    print("\n🔍 Checking environment configuration...")
    
    env_files = [
        ".env.example",
        "backend/.env.example"
    ]
    
    for env_file in env_files:
        check_file_exists(env_file, f"Environment template: {env_file}")

def print_deployment_checklist():
    """Print deployment checklist."""
    print("\n📋 VERCEL DEPLOYMENT CHECKLIST")
    print("=" * 50)
    
    checklist = [
        "🔧 Setup external services:",
        "   • PostgreSQL database (Supabase/Railway/Neon)",
        "   • Redis instance (Upstash/Railway)",
        "   • OpenAI API account with billing",
        "   • Google Cloud Project with APIs enabled",
        "",
        "🔑 Obtain API keys:",
        "   • OpenAI API key",
        "   • YouTube Data API v3 key",
        "   • Google Maps JavaScript API key",
        "",
        "🚀 Deploy to Vercel:",
        "   1. Push code to GitHub repository",
        "   2. Connect repository to Vercel",
        "   3. Set environment variables (see VERCEL_ENV_VARS.md)",
        "   4. Deploy and test",
        "",
        "✅ Post-deployment verification:",
        "   • Test frontend loads",
        "   • Test API endpoints",
        "   • Verify database connectivity",
        "   • Check logs for errors"
    ]
    
    for item in checklist:
        print(item)

def print_quick_commands():
    """Print useful commands for deployment."""
    print("\n💡 USEFUL COMMANDS")
    print("=" * 50)
    
    commands = [
        ("Local development:", "docker compose up -d"),
        ("Test backend locally:", "cd backend && uvicorn app.main:app --reload"),
        ("Test frontend locally:", "cd frontend && npm run dev"),
        ("Install Vercel CLI:", "npm i -g vercel"),
        ("Deploy to Vercel:", "vercel --prod"),
        ("Check deployment logs:", "vercel logs"),
    ]
    
    for description, command in commands:
        print(f"{description:<25} {command}")

def main():
    """Main function."""
    print("🚀 VERCEL DEPLOYMENT PREPARATION")
    print("=" * 50)
    
    # Change to project root directory
    project_root = Path(__file__).parent.parent
    os.chdir(project_root)
    print(f"📁 Working directory: {project_root.absolute()}")
    
    # Check deployment files
    files_ready = check_deployment_files()
    
    # Check environment templates
    check_env_template()
    
    # Print results
    print("\n" + "=" * 50)
    if files_ready:
        print("✅ ALL DEPLOYMENT FILES ARE READY!")
        print("📖 Read DEPLOYMENT.md for step-by-step instructions")
        print("🔑 Use VERCEL_ENV_VARS.md for environment variables setup")
    else:
        print("❌ Some deployment files are missing!")
        print("Please ensure all required files are present before deploying.")
        sys.exit(1)
    
    # Print checklist and commands
    print_deployment_checklist()
    print_quick_commands()
    
    print("\n🎉 Ready for deployment!")
    print("Visit: https://vercel.com/dashboard to deploy your project")

if __name__ == "__main__":
    main()

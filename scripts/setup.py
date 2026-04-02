"""
Quick start script for setting up the development environment
"""
import subprocess
import sys
import os


def run_command(cmd, cwd=None):
    """Run a shell command and handle errors"""
    print(f"\n📌 Running: {cmd}")
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            check=True,
            cwd=cwd,
            capture_output=False,
        )
        print("✅ Success")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error: {e}")
        return False


def main():
    """Setup development environment"""
    print("🚀 Setting up AI Personal Finance Coach Development Environment\n")
    
    # Check if we're in the right directory
    if not os.path.exists("backend") or not os.path.exists("frontend"):
        print("❌ Error: Please run this script from the project root directory")
        sys.exit(1)
    
    # Backend setup
    print("\n" + "="*60)
    print("BACKEND SETUP")
    print("="*60)
    
    if not os.path.exists("backend/venv"):
        print("\n📦 Creating virtual environment...")
        if not run_command("python3 -m venv venv", cwd="backend"):
            print("❌ Failed to create virtual environment")
            sys.exit(1)
    
    print("\n📦 Installing backend dependencies...")
    activate_cmd = "source venv/bin/activate" if os.name != "nt" else "venv\\Scripts\\activate"
    pip_cmd = f"{activate_cmd} && pip install -r requirements.txt"
    if not run_command(pip_cmd, cwd="backend"):
        print("⚠️  Failed to install dependencies. You may need to install them manually.")
    
    print("\n📝 Creating .env file from example...")
    if not os.path.exists("backend/.env"):
        run_command("cp .env.example .env", cwd="backend")
        print("⚠️  Please edit backend/.env with your database configuration")
    else:
        print("ℹ️  .env already exists")
    
    # Frontend setup
    print("\n" + "="*60)
    print("FRONTEND SETUP")
    print("="*60)
    
    print("\n📦 Installing frontend dependencies...")
    if not run_command("npm install", cwd="frontend"):
        print("❌ Failed to install frontend dependencies")
        sys.exit(1)
    
    print("\n📝 Creating .env file from example...")
    if not os.path.exists("frontend/.env"):
        run_command("cp .env.example .env", cwd="frontend")
    else:
        print("ℹ️  .env already exists")
    
    # Final instructions
    print("\n" + "="*60)
    print("✅ SETUP COMPLETE!")
    print("="*60)
    
    print("\n📋 Next Steps:")
    print("\n1. Set up PostgreSQL:")
    print("   createdb financial_coach")
    
    print("\n2. Configure backend/.env with your database URL")
    
    print("\n3. Run database migrations:")
    print("   cd backend")
    print("   source venv/bin/activate  # or venv\\Scripts\\activate on Windows")
    print("   alembic upgrade head")
    print("   python3 -m app.db.seed")
    
    print("\n4. Start Ollama (in a separate terminal):")
    print("   ollama pull llama3.2")
    print("   ollama serve")
    
    print("\n5. Start the backend (in a separate terminal):")
    print("   cd backend")
    print("   source venv/bin/activate")
    print("   uvicorn app.main:app --reload")
    
    print("\n6. Start the frontend:")
    print("   cd frontend")
    print("   npm run dev")
    
    print("\n🌐 Application URLs:")
    print("   Frontend: http://localhost:5173")
    print("   Backend:  http://localhost:8000")
    print("   API Docs: http://localhost:8000/docs")
    
    print("\n📚 Documentation:")
    print("   Development: docs/DEVELOPMENT.md")
    print("   Architecture: docs/ARCHITECTURE.md")
    print("   API Reference: docs/API.md")
    
    print("\n✨ Happy coding!")


if __name__ == "__main__":
    main()

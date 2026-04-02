"""
Utility script to run pytest with live output
"""
import sys
import subprocess

if __name__ == "__main__":
    result = subprocess.run(
        ["pytest", "-v", "--tb=short"] + sys.argv[1:],
        cwd=".",
    )
    sys.exit(result.returncode)

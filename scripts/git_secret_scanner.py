#!/usr/bin/env python3
import sys
import subprocess
import re

# Regex patterns for sensitive data
PATTERNS = {
    "Google API Key": re.compile(r"AIzaSy[A-Za-z0-9_\-]{35}"),
    "GCP Project ID": re.compile(r"project-[a-zA-Z0-9\-]{10,}"),
    "Generic API Key / Secret": re.compile(r"(?:key|secret|password|token)\s*=\s*['\"][A-Za-z0-9_\-]{16,}['\"]", re.IGNORECASE),
}

def get_staged_files(diff_filter=None):
    try:
        cmd = ["git", "diff", "--cached", "--name-only"]
        if diff_filter:
            cmd.append(f"--diff-filter={diff_filter}")
        res = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=True
        )
        return [f.strip() for f in res.stdout.splitlines() if f.strip()]
    except Exception as e:
        print(f"Error getting staged files: {e}")
        sys.exit(1)

def get_staged_content(filepath):
    try:
        # Use git show :path to get the staged content
        res = subprocess.run(
            ["git", "show", f":{filepath}"],
            capture_output=True,
            text=True,
            check=True
        )
        return res.stdout
    except Exception as e:
        # Might be a binary file or other read error
        return None

def main():
    # 1. Get all staged files (including deleted, for extension checking)
    all_staged = get_staged_files()
    
    # Block environment/key files from being committed
    env_files = [f for f in all_staged if ".env" in f.lower() or f.endswith(".pem") or f.endswith(".key")]
    if env_files:
        print("\033[91m[ERROR] Blocked commit. Do not commit environment/key files:\033[0m")
        for f in env_files:
            print(f"  - {f}")
        sys.exit(1)
        
    # 2. Get staged files excluding deleted (for content scanning)
    files_to_scan = get_staged_files(diff_filter="d")
    found_secrets = False
    
    for filepath in files_to_scan:
        # Skip scanning git hook config itself if it contains patterns
        if "git_secret_scanner.py" in filepath or "README.md" in filepath:
            # We want to allow readme placeholders, but we still scan README.md carefully.
            # To avoid scanning the regex patterns in this scanner script, we skip this script.
            if "git_secret_scanner.py" in filepath:
                continue
        
        content = get_staged_content(filepath)
        if content is None:
            continue
            
        for name, pattern in PATTERNS.items():
            matches = pattern.findall(content)
            if matches:
                # Filter out false positives / placeholders
                valid_matches = []
                for match in matches:
                    match_lower = match.lower()
                    if "your_" in match_lower or "placeholder" in match_lower or "your-gcp-project-id" in match_lower or "your_gemini_api_key_here" in match_lower:
                        continue
                    valid_matches.append(match)
                    
                if valid_matches:
                    print(f"\033[91m[ERROR] Blocked commit. Found potential {name} in '{filepath}':\033[0m")
                    for match in valid_matches:
                        # Obfuscate the secret in console output for safety
                        obfuscated = match[:6] + "..." + match[-4:] if len(match) > 10 else "..."
                        print(f"  - Pattern matched: {obfuscated}")
                    found_secrets = True
                    
    if found_secrets:
        print("\033[93mPlease remove sensitive credentials/IDs and try again.\033[0m")
        sys.exit(1)
        
    print("\033[92m[SUCCESS] Security scan passed. No secrets detected.\033[0m")
    sys.exit(0)

if __name__ == "__main__":
    main()

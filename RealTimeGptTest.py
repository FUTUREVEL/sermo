import requests
import os
import json

# Get the API key from environment variable or command line
api_key = os.getenv('OPENAI_API_KEY')

if not api_key:
    print("Error: OPENAI_API_KEY environment variable is not set")
    print("Please set your API key:")
    print("  Windows: set OPENAI_API_KEY=your_api_key")
    print("  Linux/Mac: export OPENAI_API_KEY=your_api_key")
    exit(1)

# API endpoint
url = "https://api.openai.com/v1/realtime/client_secrets"

# Headers
headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}

# Data
data = {
    "session": {
        "type": "realtime",
        "model": "gpt-realtime"
    }
}

try:
    # Make the POST request
    print("🔄 Generating ephemeral key...")
    response = requests.post(url, headers=headers, json=data, timeout=10)
    
    # Print the response
    print(f"\n✅ Status Code: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print("\n✅ Success! Ephemeral Key Generated:")
        print(json.dumps(result, indent=2))
        
        # Extract and display the ephemeral key
        ephemeral_key = result.get('value')
        if ephemeral_key:
            print(f"\n🔑 Ephemeral Key: {ephemeral_key}")
            print(f"⏱️  Expires at: {result.get('expires_at')}")
        
        # Save the result to a file for easy access
        with open('ephemeral_key.json', 'w') as f:
            json.dump(result, f, indent=2)
        print("\n💾 Key saved to ephemeral_key.json")
        
        # Auto-update the TypeScript file
        try:
            import re
            file_path = 'src/realtime.ts'
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Find and replace the old ephemeral key
            pattern = r"const apiKey = '[^']+'"
            replacement = f"const apiKey = '{ephemeral_key}'"
            
            updated_content = re.sub(pattern, replacement, content)
            
            if updated_content != content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(updated_content)
                print(f"✅ Auto-updated {file_path} with new ephemeral key")
            else:
                print("⚠️ Could not find API key pattern in TypeScript file")
                
        except Exception as e:
            print(f"⚠️ Could not auto-update TypeScript file: {e}")
            print(f"📝 Please manually copy this key to src/realtime.ts: {ephemeral_key}")
    else:
        print(f"\n❌ Error: {response.status_code}")
        print(response.text)
        
except requests.exceptions.ConnectionError:
    print("❌ Connection Error: Please check your internet connection")
except requests.exceptions.Timeout:
    print("❌ Timeout Error: Request took too long")
except Exception as e:
    print(f"❌ Error: {str(e)}")
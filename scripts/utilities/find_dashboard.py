import os
import json
from glob import glob

brain_dir = r"C:\Users\darkk\.gemini\antigravity-ide\brain"
target_file = r"app/admin/(dashboard)/page.tsx"

results = []

for root, dirs, files in os.walk(brain_dir):
    if "transcript.jsonl" in files:
        filepath = os.path.join(root, "transcript.jsonl")
        print(f"Checking {filepath}...")
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                for line in f:
                    try:
                        data = json.loads(line)
                        content = data.get("content", "")
                        
                        # Search in tool calls
                        tool_calls = data.get("tool_calls", [])
                        for tc in tool_calls:
                            args = tc.get("function", {}).get("arguments", "{}")
                            try:
                                args_obj = json.loads(args)
                                if "TargetFile" in args_obj and "page.tsx" in args_obj["TargetFile"]:
                                    if "dashboard" in args_obj["TargetFile"]:
                                        if "CodeContent" in args_obj:
                                            results.append({
                                                "file": filepath,
                                                "code": args_obj["CodeContent"]
                                            })
                                        if "ReplacementChunks" in args_obj:
                                            results.append({
                                                "file": filepath,
                                                "code": "ReplacementChunks: " + json.dumps(args_obj["ReplacementChunks"])
                                            })
                            except:
                                pass
                    except:
                        pass
        except Exception as e:
            print(f"Error reading {filepath}: {e}")

if results:
    print(f"Found {len(results)} modifications to dashboard/page.tsx.")
    with open("dashboard_history.txt", "w", encoding="utf-8") as out:
        for i, r in enumerate(results):
            out.write(f"=== {i} from {r['file']} ===\n")
            out.write(r['code'])
            out.write("\n\n")
    print("Saved to dashboard_history.txt")
else:
    print("No modifications found.")

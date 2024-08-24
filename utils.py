import json

def save_to_file(data, filename):
    with open(filename, "w") as file:
        json.dump(data, file, indent=4)

def generate_headers():
    return {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }

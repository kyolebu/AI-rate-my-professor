import time
from dotenv import load_dotenv, dotenv_values
from PIL import Image
import shutil
import sys
import re
import time
import cloudscraper

if len(sys.argv) < 2:
    print("Usage: python scraper.py <company_name>")
    sys.exit(1)

# Get the company name from the command-line arguments
company_name = sys.argv[1]

print(f"Scraping data for {company_name}")


def scrape_reviews(company):
    url = f"https://www.indeed.com/cmp/{company}/reviews?start=0"
    c_scraper = cloudscraper.create_scraper(delay=10, browser="chrome") 
    res = c_scraper.get(url) 
    
    # Define the text that indicates a security check
    security_check_text = "Security Check"

    while True:
        res = c_scraper.get(url)
        
        # Check if the response contains the security check text
        if security_check_text in res.text:
            print("Encountered a security check, retrying...")
            time.sleep(5)  # Wait for 5 seconds before retrying
            continue  # Retry the scraping process
        else:
            # Save the valid response to a file
            with open(f'res_text_{company}.txt', 'w') as file:
                file.write(res.text)
            print(f"Success! Response text saved to res_text_{company}.txt")
            break  # Exit the loop once the response is valid


def parse_reviews(text):
    reviews = []
    
    # Find all review blocks
    review_blocks = re.findall(r'"normJobTitle":"([^"]+).*?"overallRating":(\d+).*?"text":{"text":"(.*?)"}\s*,\s*"title":', text, re.DOTALL)
    
    for norm_job_title, overall_rating, review_text in review_blocks:
        review = {
            'normJobTitle': norm_job_title,
            'overallRating': int(overall_rating),
            'reviewText': review_text.replace('\\n', '\n').replace('\\"', '"')  # Unescape newlines and quotes
        }
        reviews.append(review)
    
    return reviews

def read_file_with_encoding(file_path):
    encodings = ['utf-8', 'iso-8859-1', 'windows-1252', 'ascii']
    
    for encoding in encodings:
        try:
            with open(file_path, 'r', encoding=encoding) as file:
                return file.read()
        except UnicodeDecodeError:
            continue
    
    raise ValueError(f"Unable to read the file with any of the encodings: {encodings}")

def main():
    try:
        # company_name is imported from the front end.
        scrape_reviews(company_name)
        content = read_file_with_encoding(f'res_text_{company_name}.txt')
        reviews = parse_reviews(content)
        
        # Set max_text_length to None for full text, or a number for limited display
        max_text_length = None  # Change this to a number if you want to limit the text length
        
        for i, review in enumerate(reviews, 1):
            print(f"Review {i}:")
            print(f"Job Title: {review['normJobTitle']}")
            print(f"Overall Rating: {review['overallRating']}")
            
            if max_text_length is not None:
                display_text = review['reviewText'][:max_text_length] + "..." if len(review['reviewText']) > max_text_length else review['reviewText']
            else:
                display_text = review['reviewText']
            
            print(f"Review Text: {display_text}")
            print()
    
    except ValueError as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
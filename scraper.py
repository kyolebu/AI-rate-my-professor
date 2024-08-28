import json
import time
import re
import sys
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
            with open(f'res_text_{company}.txt', 'w', encoding='utf-8') as file:
                file.write(res.text)
            print(f"Success! Response text saved to res_text_{company}.txt")
            break  # Exit the loop once the response is valid

def parse_reviews(text):
    reviews = []
    
    # Find all review blocks using regular expressions
    review_blocks = re.findall(
        r'"normJobTitle":"([^"]+).*?"overallRating":(\d+).*?"datePosted":"([^"]+).*?"reviewBody":{"text":"(.*?)"}.*?"reviewPros":"(.*?)".*?"reviewCons":"(.*?)"', 
        text, re.DOTALL
    )
    
    for norm_job_title, overall_rating, review_date, review_text, review_pros, review_cons in review_blocks:
        review = {
            'reviewTitle': norm_job_title,
            'reviewRating': overall_rating,
            'reviewDate': review_date,
            'reviewerRole': norm_job_title,
            'reviewPros': review_pros.replace('\\n', '\n').replace('\\"', '"'),  # Unescape newlines and quotes
            'reviewCons': review_cons.replace('\\n', '\n').replace('\\"', '"')   # Unescape newlines and quotes
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

def save_reviews_to_json(reviews, company):
    json_data = {
        company: reviews
    }
    
    with open(f'reviews_{company}.json', 'w', encoding='utf-8') as f:
        json.dump(json_data, f, indent=4, ensure_ascii=False)

def main():
    try:
        # Scrape reviews for the given company
        scrape_reviews(company_name)
        content = read_file_with_encoding(f'res_text_{company_name}.txt')
        reviews = parse_reviews(content)
        
        # Save the reviews to a JSON file
        save_reviews_to_json(reviews, company_name)
        print(f"Reviews saved to reviews_{company_name}.json")
    
    except ValueError as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()

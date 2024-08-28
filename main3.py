import time
import cloudscraper
company = 'Ford'
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
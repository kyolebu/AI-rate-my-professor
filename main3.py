# import cloudscraper
# from bs4 import BeautifulSoup
# import pandas as pd
# import numpy as np
# import time
# import random

# # Function to scrape reviews using cloudscraper
# def scrape_reviews_with_cloudscraper(company_name, company_url, start_page=0, end_page=460, step=20):
#     reviews_list = []
    
#     # Create a cloudscraper instance
#     c_scraper = cloudscraper.create_scraper(delay=10, browser="chrome")
    
#     for i in range(start_page, end_page, step):
#         print(f"Scraping page {i}...")
#         url = f'{company_url}?start={i}'
        
#         # Get the page content using cloudscraper
#         res = c_scraper.get(url)
        
#         if res.status_code != 200:
#             print(f"Failed to retrieve data for page {i}. Status code: {res.status_code}")
#             continue
        
#         # Parse the content with BeautifulSoup
#         soup = BeautifulSoup(res.text, 'lxml')
#         main_data = soup.find_all("div", attrs={"data-tn-section": "reviews"})
        
#         for data in main_data:
#             try:
#                 title = data.find("h2").get_text(strip=True)
#             except AttributeError:
#                 title = np.nan
                
#             try:
#                 author = data.find("span", attrs={"itemprop": "author"}).get_text(strip=True).split("-")[1]
#             except AttributeError:
#                 author = np.nan
                
#             try:
#                 review = data.find("span", attrs={"itemprop": "reviewBody"}).get_text(strip=True)
#             except AttributeError:
#                 review = np.nan
                
#             try:
#                 rating = data.find("div", attrs={"itemprop": "reviewRating"}).find("button")['aria-label'].split(" ")[0]
#             except AttributeError:
#                 rating = np.nan
                
#             reviews_list.append([title, author, review, rating])
        
#         # Random delay to avoid detection
#         time.sleep(random.uniform(1, 3))
    
#     # Convert the list to a DataFrame
#     df_reviews = pd.DataFrame(data=reviews_list, columns=['Title', 'Author', 'Review', 'Rating'])
#     print(df_reviews)
#     # # Save to CSV
#     # file_name = f"{company_name}_reviews.csv"
#     # df_reviews.to_csv(file_name, index=False)
#     # print(f"Reviews saved to {file_name}")

# # Parameters
# company_name = "Meta"
# company_url = "https://www.indeed.com/cmp/Meta-dd1502f2/reviews"

# # Scrape reviews
# scrape_reviews_with_cloudscraper(company_name, company_url)




import cloudscraper
url = "https://www.indeed.com/cmp/Meta-dd1502f2/reviews?start=0"
c_scraper = cloudscraper.create_scraper(delay=10, browser="chrome") 
res = c_scraper.get(url) 
 
print(res.text)




# import requests
# from bs4 import BeautifulSoup
# import pandas as pd
# import numpy as np
# import time
# import random

# def scrape_reviews(company_name, company_url, start_page=0, end_page=460, step=20):
#     reviews_list = []
    
#     for i in range(start_page, end_page, step):
#         print(f"Scraping page {i}...")
#         url = f'{company_url}?start={i}'
#         headers = {
#             "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.5845.96 Safari/537.36",
#             "Accept-Language": "en-US,en;q=0.9",
#             "Accept-Encoding": "gzip, deflate, br",
#             "Connection": "keep-alive",
#             "Referer": "https://www.indeed.com/",
#             "DNT": "1",
#         }
        
#         # Optional: Add proxy support
#         # proxies = {
#         #     "http": "http://your-proxy.com",
#         #     "https": "https://your-proxy.com",
#         # }
        
#         # Get the page content
#         page = requests.get(url, headers=headers)
        
#         if page.status_code == 403:
#             print(f"Failed to retrieve data for page {i}. Status code: 403")
#             continue
        
#         soup = BeautifulSoup(page.content, 'lxml')
#         main_data = soup.find_all("div", attrs={"data-tn-section": "reviews"})
        
#         for data in main_data:
#             try:
#                 title = data.find("h2").get_text(strip=True)
#             except AttributeError:
#                 title = np.nan
                
#             try:
#                 author = data.find("span", attrs={"itemprop": "author"}).get_text(strip=True).split("-")[1]
#             except AttributeError:
#                 author = np.nan
                
#             try:
#                 review = data.find("span", attrs={"itemprop": "reviewBody"}).get_text(strip=True)
#             except AttributeError:
#                 review = np.nan
                
#             try:
#                 rating = data.find("div", attrs={"itemprop": "reviewRating"}).find("button")['aria-label'].split(" ")[0]
#             except AttributeError:
#                 rating = np.nan
                
#             reviews_list.append([title, author, review, rating])
        
#         # Random delay to avoid detection
#         time.sleep(random.uniform(1, 3))
    
#     # Convert the list to a DataFrame
#     df_reviews = pd.DataFrame(data=reviews_list, columns=['Title', 'Author', 'Review', 'Rating'])
#     print(df_reviews)
#     # Save to CSV
#     # file_name = f"{company_name}_reviews.csv"
#     # df_reviews.to_csv(file_name, index=False)
#     # print(f"Reviews saved to {file_name}")

# # Parameters
# company_name = "Meta"
# company_url = "https://www.indeed.com/cmp/Meta-dd1502f2/reviews"

# # Scrape reviews
# scrape_reviews(company_name, company_url)

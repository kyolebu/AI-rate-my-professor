import time
from selenium import webdriver
from selenium_driver import get_driver
from parse_reviews import parse_reviews
from utils import save_to_file

class GlassdoorScraper:
    def __init__(self):
        self.url = "https://www.glassdoor.com/Reviews/General-Motors-GM-Reviews-E279.htm"
        self.driver = get_driver()

    def run(self):
        self.driver.get(self.url)
        time.sleep(5)  # Wait for the page to load completely
        reviews_html = self.driver.page_source

        # Print a portion of the HTML to check if it's loading correctly
        print(reviews_html[:1000])  # Print first 1000 characters for debugging

        reviews = parse_reviews(reviews_html)
        save_to_file(reviews, "data/processed/reviews.json")
        self.driver.quit()

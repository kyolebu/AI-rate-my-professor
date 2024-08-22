import undetected_chromedriver as uc
from selenium.webdriver.chrome.options import Options

def get_driver():
    options = Options()
    options.headless = True  # You may disable headless mode to see what's happening
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.6613.85 Safari/537.36")

    # Use undetected-chromedriver
    driver = uc.Chrome(options=options)
    return driver

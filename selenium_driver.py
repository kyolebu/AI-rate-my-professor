import undetected_chromedriver as uc
from selenium.webdriver.chrome.options import Options
from seleniumbase import Driver

def get_driver():
    options = Options()
    options.headless = True  # You may disable headless mode to see what's happening
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.6613.85 Safari/537.36")
    options.add_argument("--incognito")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option('useAutomationExtension', False)
    prefs = {"credentials_enable_service": False, "profile.password_manager_enabled": False}
    options.add_experimental_option("prefs", prefs)

    from selenium import webdriver
    # from selenium.webdriver.firefox.service import Service
    # from selenium.webdriver.firefox.options import Options
    from selenium.webdriver.firefox.service import Service as FirefoxService
    from selenium.webdriver.firefox.options import Options as FirefoxOptions

    firefox_options = FirefoxOptions()
    firefox_options.add_argument("--start-maximized")
    firefox_options.add_argument("--disable-extensions")
    service = FirefoxService('geckodriver.exe')
    driver = webdriver.Firefox(service=service, options=firefox_options)

    # create a Driver instance with undetected_chromedriver (uc) and headless mode

    # driver = Driver(uc=True, headless=True)


    # Use undetected-chromedriver
    # driver = uc.Chrome(options=options)
    return driver

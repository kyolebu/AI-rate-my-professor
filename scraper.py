import pyautogui
import webbrowser
import time
from dotenv import load_dotenv, dotenv_values
import os
import sys



if len(sys.argv) < 2:
    print("Usage: python scraper.py <company_name>")
    sys.exit(1)

# Get the company name from the command-line arguments
company_name = sys.argv[1]

print(f"Scraping data for {company_name}")
load_dotenv()


# Open up file to copy code
pyautogui.hotkey('win', 'e')
time.sleep(15)

# Type file path in the home searchbar in file explorer and Focus on the address bar (Ctrl + L or Alt + D)
pyautogui.hotkey('ctrl', 'l')  # You can also use 'alt', 'd' depending on your version
time.sleep(3)
config = dotenv_values(".env")




pyautogui.write(os.getenv("TOOL_SCRAPE_PATH"))
time.sleep(5)
pyautogui.press('enter')  # Execute

print("Clicked on file of interest holding the JS code")
time.sleep(15)


# Select all content and copy
pyautogui.hotkey('ctrl', 'a')  # Select all
pyautogui.hotkey('ctrl', 'c')  # Copy
time.sleep(5)


# Open the Glassdoor login page in the default web browser
webbrowser.open('https://www.glassdoor.com/profile/login_input.htm')

# Wait for the page to load
time.sleep(10)

# Click "Sign in with Google"
pyautogui.moveRel(-500,-500)  # Move left by -200 pixels
time.sleep(5)
pyautogui.click()

for _ in range(3):
    pyautogui.press('tab')

pyautogui.press('enter')

# Add a delay if necessary for the new page to load
time.sleep(5)

# Click "Log in with Fireside"
fireside_location = pyautogui.locateCenterOnScreen(os.getenv("FIRESIDE_GMAIL"), confidence=0.6)
if fireside_location is not None:
    pyautogui.click(fireside_location)
    print("Clicked on 'Log in with Fireside' button")
else:
    print("Could not find the 'Sign in with Fireside' button on the screen")

time.sleep(5)

# Click "Continue"
for _ in range(6):
    pyautogui.press('tab')

pyautogui.press('enter')
time.sleep(5)

# Click "Companies"
for _ in range(6):
    pyautogui.press('tab')

pyautogui.press('enter')
time.sleep(5)

# Get to the company search
for _ in range(17):
    pyautogui.press('tab')
    

time.sleep(2)

# Type the search query
#search_query = 'Amazon'
pyautogui.write(company_name)
time.sleep(2)
# Click "Search"
pyautogui.press('tab')
pyautogui.press('enter')
time.sleep(5)

    


# Now this code will only work for large companies like Amazon, Google, etc because multiple searches will show up. Get to the company search
pyautogui.click()
pyautogui.press('tab')
time.sleep(1)
pyautogui.press('enter')
time.sleep(5)

# Now get to review page
pyautogui.click()
for _ in range(5):
    pyautogui.press('tab')
    
pyautogui.press('enter')
time.sleep(5)

# Open console. Works for default edge browser for windows
print('Time to open console')
pyautogui.hotkey('ctrl', 'shift', 'j')
time.sleep(15)

# Paste the JavaScript code into the console
pyautogui.press('tab')
pyautogui.hotkey('ctrl', 'v')  # Paste
pyautogui.press('enter')  # Execute
time.sleep(50)  # Wait for execution

# Close the console
pyautogui.hotkey('ctrl', 'shift', 'j')

print("Script executed and JavaScript run.")

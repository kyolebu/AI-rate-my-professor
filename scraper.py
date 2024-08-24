import pyautogui
import webbrowser
import time
from dotenv import load_dotenv
import os

load_dotenv()

# Open the JavaScript file

'''
# Open up file to copy code
pyautogui.hotkey('win', 'e')


time.sleep(15)

# Type file path in the home searchbar in file explorer and Focus on the address bar (Ctrl + L or Alt + D)

pyautogui.hotkey('ctrl', 'l')  # You can also use 'alt', 'd' depending on your version
time.sleep(3)
pyautogui.write(os.getenv("TOOL_SCRAPE_PATH"))
time.sleep(5)
pyautogui.press('enter')  # Execute

print("Clicked on file of interest holding the JS code")


time.sleep(15)


# Select all content and copy
pyautogui.hotkey('ctrl', 'a')  # Select all
pyautogui.hotkey('ctrl', 'c')  # Copy
time.sleep(5)
'''

# Open the Glassdoor login page in the default web browser
webbrowser.open('https://www.glassdoor.com/profile/login_input.htm')

# Wait for the page to load
time.sleep(10)

# Click "Sign in with Google"
pyautogui.moveRel(-100, -50)  # Move left by -100 pixels

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
continue_location = pyautogui.locateCenterOnScreen(os.getenv("CONTINUE"), confidence=0.6)
if continue_location is not None:
    pyautogui.click(continue_location)
    print("Clicked on 'Continue' button")
else:
    print("Could not find the 'Continue' button on the screen")

time.sleep(5)

# Click "Companies"
companies_location = pyautogui.locateCenterOnScreen(os.getenv("COMPANIES"), confidence=0.6)
if companies_location is not None:
    pyautogui.click(companies_location)
    print("Clicked on companies tab")
else:
    print("Could not find the 'Companies' tab on the screen")

time.sleep(5)

# Trigger the Find dialog with Control+F
pyautogui.hotkey('ctrl', 'f')

# Add a short delay to ensure the Find dialog has time to open
time.sleep(1)


pyautogui.write("Have an employer in mind?")

# Optionally, press Enter to execute the search if needed
pyautogui.press('enter')

# Click "Companies"
companies = pyautogui.locateCenterOnScreen(os.getenv("SEARCH_COMPANIES"), confidence=0.6)
if companies is not None:
    pyautogui.click(companies)
    print("Clicked on search companies field")
else:
    print("Could not find the search companies field on the screen")

time.sleep(5)
# Type the search query
search_query = 'Amazon'
pyautogui.write(search_query)

# Click "Search"
search = pyautogui.locateCenterOnScreen(os.getenv("SEARCH"), confidence=0.6)
if companies is not None:
    pyautogui.click(search)
    print("Clicked on search tab")
else:
    print("Could not find the 'search' tab on the screen")



# Open the browser console using keyboard shortcut
pyautogui.hotkey('ctrl', 'shift', 'j')
time.sleep(2)  # Allow time for the console to open

pyautogui.click()
time.sleep(2)
    
# Paste the JavaScript code into the console
pyautogui.hotkey('ctrl', 'v')  # Paste
pyautogui.press('enter')  # Execute
time.sleep(5)  # Wait for execution

# Close the console
pyautogui.hotkey('ctrl', 'shift', 'j')

print("Script executed and JavaScript run.")

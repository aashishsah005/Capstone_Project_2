import sys
import json
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def scrape_amazon(query):
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--start-maximized")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")

    driver = webdriver.Chrome(options=options)
    results = []

    try:
        driver.get(f"https://www.amazon.in/s?k={query}")
        wait = WebDriverWait(driver, 10)
        
        # Wait for either the search results or a specific element to load
        try:
            wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, 'div[data-component-type="s-search-result"]')))
        except:
            pass # Continue to try and find elements anyway

        products = driver.find_elements(By.CSS_SELECTOR, 'div[data-component-type="s-search-result"]')
        
        for p in products:
            if len(results) >= 5:
                break
                
            try:
                # Title
                try:
                    title_elem = p.find_element(By.CSS_SELECTOR, "h2 span")
                    title = title_elem.text.strip()
                except:
                    continue # Title is mandatory
                
                if not title:
                    continue

                # Price
                try:
                    price_elem = p.find_element(By.CSS_SELECTOR, ".a-price .a-offscreen")
                    price = price_elem.get_attribute("textContent").strip()
                except:
                    price = "N/A"

                # Image
                try:
                    image_elem = p.find_element(By.CSS_SELECTOR, "img.s-image")
                    image = image_elem.get_attribute("src")
                except:
                    image = "N/A"

                # Link
                try:
                    link_elem = p.find_element(By.CSS_SELECTOR, "a.a-link-normal")
                    link = link_elem.get_attribute("href")
                except:
                    link = "N/A"
                    
                if link != "N/A" and link.startswith("/"):
                    link = "https://www.amazon.in" + link

                results.append({
                    "title": title,
                    "price": price,
                    "image": image,
                    "link": link,
                    "site": "Amazon"
                })
            except Exception as e:
                continue

    except Exception as e:
        pass
    finally:
        if driver:
            driver.quit()

    return results

if __name__ == "__main__":
    query = sys.argv[1] if len(sys.argv) > 1 else "laptop"
    data = scrape_amazon(query)
    print(json.dumps(data))
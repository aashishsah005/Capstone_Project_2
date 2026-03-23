from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import sys
import json
import time

def scrape_flipkart(query):
    options = Options()
    options.add_argument("--headless")  # Run in headless mode
    options.add_argument("--start-maximized")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")

    driver = webdriver.Chrome(options=options)

    try:
        driver.get(f"https://www.flipkart.com/search?q={query}")
        
        wait = WebDriverWait(driver, 10)
        
        # Try multiple selectors for product containers
        container_selectors = ["div.tUxRFH", "div._1AtVbE", "div.cPHDOP", "div[data-id]"]
        products = []
        for selector in container_selectors:
            try:
                products = wait.until(
                    EC.presence_of_all_elements_located((By.CSS_SELECTOR, selector))
                )
                if len(products) > 0:
                    # Filter out non-product containers if using broad selectors
                    if selector == "div[data-id]":
                        products = [p for p in products if p.get_attribute("data-id")]
                    break
            except:
                continue

        results = []

        for p in products:
            if len(results) >= 5:
                break
                
            try:
                # Title selectors
                title_selectors = ["div.KzDlHZ", "div.Kz_39P", ".RG5Slk", "a.w_S_GZ", "div._4rR01T", "a.IRpw9B"]
                title = "N/A"
                for selector in title_selectors:
                    try:
                        title_elem = p.find_element(By.CSS_SELECTOR, selector)
                        title = title_elem.text.strip()
                        if title and title != "N/A": break
                    except: continue
                
                # Price selectors
                price_selectors = ["div.Nx9_7j", "div.Nx9ZRD", "div._30jeq3", "div._25b18c ._30jeq3", "div._16Jk6d"]
                price = "N/A"
                for selector in price_selectors:
                    try:
                        price_elem = p.find_element(By.CSS_SELECTOR, selector)
                        price = price_elem.text.strip()
                        if price and price != "N/A": break
                    except: continue

                # If no title or price, it might not be a valid result we want to show
                if title == "N/A" and price == "N/A":
                    continue

                # Link
                try:
                    # Look for a tag inside or use the container if it is an 'a' tag
                    if p.tag_name == 'a':
                        link = p.get_attribute("href")
                    else:
                        link_elem = p.find_element(By.TAG_NAME, "a")
                        link = link_elem.get_attribute("href")
                except:
                    link = "N/A"

                # Image
                try:
                    image_selectors = ["img.DByoH4", "img"]
                    image = "N/A"
                    for selector in image_selectors:
                        try:
                            image_elem = p.find_element(By.CSS_SELECTOR, selector)
                            image = image_elem.get_attribute("src")
                            if image and image != "N/A": break
                        except: continue
                except:
                    image = "N/A"

                results.append({
                    "title": title,
                    "price": price,
                    "image": image,
                    "link": link,
                    "site": "Flipkart"
                })
            except Exception as e:
                continue

        driver.quit()
        return results

    except Exception as e:
        if driver:
            driver.quit()
        return []

if __name__ == "__main__":
    if len(sys.argv) > 1:
        query = sys.argv[1]
    else:
        query = "laptop"
    
    try:
        data = scrape_flipkart(query)
        print(json.dumps(data))
    except Exception as e:
        print(json.dumps([]))
        sys.exit(0)
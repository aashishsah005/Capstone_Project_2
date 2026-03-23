import requests
from bs4 import BeautifulSoup
import time
import sys
import json

def scrape_amazon(query):
    results = []
    for i in range(1,5):
        time.sleep(2)
        url = f"https://www.amazon.in/s?k={query}&page={i}"
        headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Connection": "keep-alive"
        }

        response = requests.get(url, headers=headers)
        
        if response.status_code != 200:
            print("Request blocked!")
            break
        soup = BeautifulSoup(response.text, "html.parser")

        products = soup.select('div[data-component-type="s-search-result"]')
        
        for product in products:
            if len(results) >= 5:
                break
            #title = product.select_one("h2.a-size-medium span")
            title = product.select_one("h2 a.a-link-normal span") or product.select_one("h2 span")
            price = product.select_one(".a-price .a-offscreen") or product.select_one(".a-price-whole")
            image = product.select_one("img.s-image")
            link = product.select_one("h2 a.a-link-normal") or product.select_one("a.a-link-normal")

            if title:
                results.append({
                "title": title.text.strip(),
                "price": price.text.strip() if price else "N/A",
                "image": image["src"] if image else "N/A",
                "link": "https://www.amazon.in" + link["href"] if link else "N/A",
                "site": "Amazon"
            })
        
        if len(results) >= 5:
            break

    return results[:5]

if __name__ == "__main__":
    query = sys.argv[1] if len(sys.argv) > 1 else "laptop"
    data = scrape_amazon(query)
    print(json.dumps(data[:5]))  # Limit to 5
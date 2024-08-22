from bs4 import BeautifulSoup

def parse_reviews(html_content):
    soup = BeautifulSoup(html_content, "html.parser")
    reviews = []

    review_elements = soup.find_all("div", class_="gdReview")
    for review in review_elements:
        title = review.find("a", class_="reviewLink").text.strip()
        rating = review.find("span", class_="rating").text.strip()
        reviews.append({
            "title": title,
            "rating": rating
        })

    return reviews

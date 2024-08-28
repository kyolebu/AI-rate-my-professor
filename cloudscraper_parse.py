import re

def parse_reviews(text):
    reviews = []
    
    # Find all review blocks
    review_blocks = re.findall(r'"normJobTitle":"([^"]+).*?"overallRating":(\d+).*?"text":{"text":"(.*?)"}\s*,\s*"title":', text, re.DOTALL)
    
    for norm_job_title, overall_rating, review_text in review_blocks:
        review = {
            'normJobTitle': norm_job_title,
            'overallRating': int(overall_rating),
            'reviewText': review_text.replace('\\n', '\n').replace('\\"', '"')  # Unescape newlines and quotes
        }
        reviews.append(review)
    
    return reviews

def read_file_with_encoding(file_path):
    encodings = ['utf-8', 'iso-8859-1', 'windows-1252', 'ascii']
    
    for encoding in encodings:
        try:
            with open(file_path, 'r', encoding=encoding) as file:
                return file.read()
        except UnicodeDecodeError:
            continue
    
    raise ValueError(f"Unable to read the file with any of the encodings: {encodings}")

def main():
    try:
        content = read_file_with_encoding('res_text_Meta.txt')
        reviews = parse_reviews(content)
        
        # Set max_text_length to None for full text, or a number for limited display
        max_text_length = None  # Change this to a number if you want to limit the text length
        
        for i, review in enumerate(reviews, 1):
            print(f"Review {i}:")
            print(f"Job Title: {review['normJobTitle']}")
            print(f"Overall Rating: {review['overallRating']}")
            
            if max_text_length is not None:
                display_text = review['reviewText'][:max_text_length] + "..." if len(review['reviewText']) > max_text_length else review['reviewText']
            else:
                display_text = review['reviewText']
            
            print(f"Review Text: {display_text}")
            print()
    
    except ValueError as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
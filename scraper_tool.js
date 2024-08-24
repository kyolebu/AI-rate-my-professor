javascript:(function() {
    localStorage.clear(); // Clear local storage to ensure no old data persists
    let scrapedData = JSON.parse(localStorage.getItem('scrapedData')) || [];
    let pageCounter = 0;
    console.log('Starting scraping process...');

    function scrapeCurrentPage() {
        const reviews = [];
        document.querySelectorAll('#ReviewsFeed > ol > li').forEach((reviewElement) => {
            const reviewText = reviewElement.innerText || '';
            console.log('Review Text:', reviewText);
            reviews.push({
                text: reviewText
            });
        });

        scrapedData.push(...reviews);
        localStorage.setItem('scrapedData', JSON.stringify(scrapedData));
        console.log(`Scraped ${reviews.length} reviews from this page.`);
    }

    function goToNextPage() {
        if (pageCounter < 10) {
            const nextPageButton = document.querySelector('#__next > div.infosite-layout_infositeContainer__ZX_HE > div:nth-child(2) > main > div > div.PaginationContainer_paginationContainer__yQBkZ > nav > ol > li:nth-child(9) > button');

            if (nextPageButton && !nextPageButton.disabled) {
                console.log('Navigating to next page...');
                nextPageButton.click();
                pageCounter++;
                // Immediately scrape the next page after clicking the button
                setTimeout(() => {
                    scrapeCurrentPage();
                    goToNextPage();
                }, 2000); // Adjust timeout as needed to allow page loading
            } else {
                console.log('No more pages to scrape.');
                console.log(`Total reviews scraped: ${scrapedData.length}`);
                console.log('Final scraped data:', scrapedData);
                
                // Create a blob from the data
                let blob = new Blob([JSON.stringify(scrapedData, null, 2)], { type: 'application/json' });
                
                // Create a link element
                let link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'scrapedData.json';
                
                // Append the link to the body
                document.body.appendChild(link);
                
                // Programmatically click the link to trigger the download
                link.click();
                
                // Clean up by removing the link
                document.body.removeChild(link);
                
                console.log('Data has been downloaded as scrapedData.json');
            }
        } else {
            console.log('Scraping complete. Reached the limit of 10 pages.');
            console.log(`Total reviews scraped: ${scrapedData.length}`);
            console.log('Final scraped data:', scrapedData);
            
            // Create a blob from the data
            let blob = new Blob([JSON.stringify(scrapedData, null, 2)], { type: 'application/json' });
            
            // Create a link element
            let link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'scrapedData.json';
            
            // Append the link to the body
            document.body.appendChild(link);
            
            // Programmatically click the link to trigger the download
            link.click();
            
            // Clean up by removing the link
            document.body.removeChild(link);
            
            console.log('Data has been downloaded as scrapedData.json');
        }
    }

    scrapeCurrentPage();
    goToNextPage();
})();

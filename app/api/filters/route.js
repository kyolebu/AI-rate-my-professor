import { Pinecone } from '@pinecone-database/pinecone';


export async function GET(req) {
    
    try {
        const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
        const indexName = 'company-reviews'; // Replace with your actual index name
        const namespaceName = 'ns1'; // Replace with your actual namespace if applicable

         // Check if the index exists
        const indexesResponse = await pc.listIndexes();
        const indexNames = indexesResponse.indexes.map(index => index.name);
        const indexExists = indexNames.includes(indexName);

        if (!indexExists) {
            console.log(`Index ${indexName} does not exist. Creating index...`);
            await pc.createIndex({
                name: indexName,
                dimension: 384, // Adjust based on your embedding model
                metric: 'cosine', // Adjust based on your use case
                spec: {
                    serverless: {
                        cloud: 'aws',
                        region: 'us-east-1',
                    },
                },
            });
        }
        const index = pc.index(indexName).namespace(namespaceName);

        // Fetch companies
        const statsResponse = await index.describeIndexStats();
        console.log('Stats response:', statsResponse); // Log the entire response

        let companies = [];
        if (statsResponse && statsResponse.dimension) {
            // If we can't get companies from metadata, we'll fetch them from the actual data
            const queryResponse = await index.query({
                topK: 150, // Adjust based on your needs
                includeMetadata: true,
                vector: new Array(statsResponse.dimension).fill(0) // Create a zero vector of the correct dimension
            });

            companies = [...new Set(queryResponse.matches.map(match => match.metadata.company))];
        }

        // // Fetch companies (assuming they're stored in metadata)
        // const companiesResponse = await index.describeIndexStats({
        //     includeMetadataFields: ['company'],
        // });
        // const companies = companiesResponse.stats.metadataFields.company.values;

        // Ratings are now from 1 to 5 in increments of 0.5
        const ratings = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

        return new Response(
            JSON.stringify({
                companies,
                ratings,
            }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
    } catch (error) {
        console.error('Error retrieving filters:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to retrieve filters' }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
    }
}

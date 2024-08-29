import { Pinecone } from '@pinecone-database/pinecone';
import fs from 'fs/promises';
import path from 'path';

async function readNamespaces() {
    const filePath = path.join(process.cwd(), 'namespaces.json');
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
}

export async function GET(req) {
    try {
        const namespaces = await readNamespaces();
        console.log('Namespaces in filter:', namespaces);
        const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
        const indexName = 'company-reviews'; // Replace with your actual index name

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
        // const index = pc.index(indexName);

        // Fetch stats response
        // const statsResponse = await index.describeIndexStats();
        // console.log('Full Stats Response:', JSON.stringify(statsResponse, null, 2)); // Log the full response for debugging
        // const index = pc.index(indexName)
        // const statsResponse = await index.describeIndexStats();
        // console.log(statsResponse)
        // const namespaces = statsResponse.namespaces ? Object.keys(statsResponse.namespaces) : [];
        // console.log('Namespaces:', namespaces);

        // let companies = [];

        // if (statsResponse && statsResponse.namespaces) {
        //     for (const namespace of Object.keys(statsResponse.namespaces)) {
        //         console.log(`Processing namespace: ${namespace}`);
        //         const queryResponse = await index.namespace(namespace).query({
        //             topK: 150,
        //             includeMetadata: true,
        //             vector: new Array(statsResponse.dimension).fill(0) // Use a meaningful vector or adjust as needed
        //         });

        //         const namespaceCompanies = queryResponse.matches.map(match => match.metadata.company);
        //         companies = [...new Set([...companies, ...namespaceCompanies])];
        //     }
        // }

        // const namespaces = ['Amazon', 'Google', 'Meta', 'Oracle'];

        let companies = [];

        // for (const namespace of namespaces) {
        //     try {
        //         console.log(`Processing namespace: ${namespace}`);
        //         const queryResponse = await index.namespace(namespace).query({
        //             topK: 150,
        //             includeMetadata: true,
        //             vector: new Array(statsResponse.dimension).fill(0) // Use a meaningful vector or adjust as needed
        //         });

        //         // console.log(`Query response for ${namespace}:`, JSON.stringify(queryResponse, null, 2));
                
        //         const namespaceCompanies = queryResponse.matches.map(match => match.metadata.company);
        //         companies = [...new Set([...companies, ...namespaceCompanies])];
        //     } catch (error) {
        //         console.error(`Error processing namespace ${namespace}:`, error);
        //     }
        // }

        // Ratings are now from 1 to 5 in increments of 0.5
        const ratings = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
        companies = namespaces;

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

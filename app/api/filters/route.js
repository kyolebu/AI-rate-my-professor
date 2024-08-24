import { Pinecone } from '@pinecone-database/pinecone';

// export default async function handler(req, res) {
//     const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
//     const index = pc.index('rag').namespace('ns1');

//     const subjectsResponse = await index.describeIndexStats({
//         includeMetadataFields: ['subject'],
//     });

//     const ratingsResponse = await index.describeIndexStats({
//         includeMetadataFields: ['stars'],
//     });

//     const subjects = subjectsResponse.stats.metadataFields.subject.values;
//     const ratings = ratingsResponse.stats.metadataFields.stars.values;

//     res.status(200).json({
//         subjects,
//         ratings,
//     });
// }

export async function GET(req) {
    // // Example data - you should replace this with actual data from Pinecone or another source
    // const subjects = ["Math", "Environmental Science", "World History"]; 
    // const ratings = [1, 2, 3, 4, 5];

    // return new Response(
    //     JSON.stringify({
    //         subjects,
    //         ratings,
    //     }),
    //     {
    //         status: 200,
    //         headers: {
    //             'Content-Type': 'application/json',
    //         },
    //     }
    // );
    try {
        const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
        const indexName = 'rag'; // Replace with your actual index name
        const namespaceName = 'ns1'; // Replace with your actual namespace if applicable

        const index = pc.index(indexName).namespace(namespaceName);

        let subjectsSet = new Set();
        let offset = 0;
        const batchSize = 100;

        while (true) {
            const results = await index.query({
                topK: batchSize, // Fetch batchSize results at a time
                vector: Array(384).fill(0), // Dummy vector for querying
                includeMetadata: true,
                includeValues: false, // Skip vectors to minimize payload size
            });

            if (results.matches.length === 0) {
                break; // No more subjects to fetch
            }

            results.matches.forEach(match => {
                const subject = match.metadata.subject;
                if (subject) {
                    subjectsSet.add(subject);
                }
            });

            if (results.matches.length < batchSize) {
                break; // Stop if fewer results than the batch size indicate we've fetched all data
            }

            offset += batchSize;
        }

        const subjects = Array.from(subjectsSet);
        
        const ratings = [1, 2, 3, 4, 5]; // Assuming ratings are standard

        return new Response(
            JSON.stringify({
                subjects,
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
        console.error('Error retrieving subjects:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to retrieve subjects' }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
    }
}
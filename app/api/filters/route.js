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
        const indexName = 'company-reviews'; // Replace with your actual index name
        const namespaceName = 'ns1'; // Replace with your actual namespace if applicable

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
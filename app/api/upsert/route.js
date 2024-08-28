import { NextResponse } from 'next/server'
import { Pinecone } from '@pinecone-database/pinecone'
import { HfInference } from '@huggingface/inference';
import Groq from "groq-sdk";
import fs from 'fs/promises';
import path from 'path';


const inference = new HfInference(process.env.HUGGINGFACE_API_KEY);
const pc = new Pinecone({apiKey: process.env.PINECONE_API_KEY});
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function upsertToPinecone(index, companyName) {
    try {
        const filePath = path.join(process.cwd(), `reviews_${companyName}.json`);
        console.log('Attempting to read file:', filePath);

        const fileContents = await fs.readFile(filePath, 'utf8');
        console.log('File contents read successfully');

        let reviewsData;
        try {
            reviewsData = JSON.parse(fileContents);
            console.log('JSON parsed successfully');
        } catch (parseError) {
            console.error('Error parsing JSON:', parseError);
            throw new Error('Failed to parse JSON data');
        }

        if (!reviewsData || typeof reviewsData !== 'object') {
            throw new Error('Invalid data structure in JSON file');
        }

        const batchSize = 100; // Pinecone recommends batches of 100 or fewer
        let totalUpserted = 0;

        for (const [company, reviews] of Object.entries(reviewsData)) {
            for (let i = 0; i < reviews.length; i += batchSize) {
                const batch = reviews.slice(i, i + batchSize);
                const vectors = await Promise.all(batch.map(async (review, reviewIndex) => {
                    // Combine all text fields for embedding
                    const reviewText = `${review.reviewTitle} ${review.reviewerRole} ${review.reviewPros} ${review.reviewCons}`;
                    
                    const embedding = await inference.featureExtraction({
                        model: "sentence-transformers/all-MiniLM-L6-v2",
                        inputs: [reviewText],
                    });

                    return {
                        id: `${company}_${i + reviewIndex}`, // Unique ID for each review
                        values: Array.from(embedding),
                        metadata: {
                            company: company,
                            reviewerRole: review.reviewerRole,
                            // reviewTitle: review.reviewTitle,
                            reviewRating: parseFloat(review.reviewRating),
                            reviewText: review.reviewText
                            // reviewDate: review.reviewDate,
                            // reviewerRole: review.reviewerRole,
                            // reviewPros: review.reviewPros,
                            // reviewCons: review.reviewCons
                        }
                    };
                }));

                await index.upsert(vectors);
                totalUpserted += vectors.length;
                console.log(`Upserted batch for ${company}: ${totalUpserted} reviews`);
            }
        }
        console.log('All data upserted successfully');
    } catch (error) {
        console.error('Error upserting data:', error);
        throw error;
    }
  }

export async function POST(req) {
    const data = await req.json()
    const companyName = data.companyName; // Extract company name from request body
    console.log("companyName in upsert POST: ", companyName)
    const pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    })
    
    const indexName = 'company-reviews';
    //const namespaceName = 'ns1';
    const namespaceName = companyName; // Use companyName as namespace

    
    // Fetch all indexes
    const indexesResponse = await pc.listIndexes();
    console.log("Indexes Response:", indexesResponse);

    // Extract the index names
    const indexNames = indexesResponse.indexes.map(index => index.name);
    console.log("Extracted Index Names:", indexNames);

    // Check if the index exists
    const indexExists = indexNames.includes(indexName);

    console.log(`Index ${indexExists ? 'exists' : 'does not exist'}`);

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
        console.log(`Index ${indexName} created successfully.`);
    }

    const index = pc.index(indexName).namespace(namespaceName);

    // Only upsert if companyName is provided
    if (companyName) {
        console.log("companyName found and trying upsert: ", companyName)
        await upsertToPinecone(index, companyName);
    }

    return NextResponse.json({ message: `Data for ${companyName} has been upserted]` })
}
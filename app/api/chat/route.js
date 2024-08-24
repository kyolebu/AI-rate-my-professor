import { NextResponse } from 'next/server'
import { Pinecone } from '@pinecone-database/pinecone'
import { HfInference } from '@huggingface/inference';
import Groq from "groq-sdk";
import fs from 'fs/promises';
import path from 'path';


const systemPrompt = `
You are a Company Review assistant that helps users find companies and their ratings. You can provide personalized company recommendations based on user input criteria.
For every user question, analyze their requirements and use the top 3 matching companies returned from the vector database to provide recommendations.
Consider factors such as role, pros, cons, and review ratings when making recommendations.
Provide concise yet informative answers, and always base your recommendations on the data provided. Do not make up any information. Only look for the information in the data provided.
If a company cannot be found with the given role or rating, respond by saying a matching company could not be found.
`;

// const systemPrompt = 
// `
// You are a rate my professor agent to help students find classes, that takes in user questions and answers them.
// For every user question, the top 3 professors that match the user question are returned.
// Use them to answer the question if needed. Answer using knowledge given to you ONLY. Do NOT make anything up of your own.
// `

const inference = new HfInference(process.env.HUGGINGFACE_API_KEY);
const pc = new Pinecone({apiKey: process.env.PINECONE_API_KEY});
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function upsertToPinecone(index) {
    try {
        const filePath = path.join(process.cwd(), 'company_reviews.json');
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
                            reviewTitle: review.reviewTitle,
                            reviewRating: parseFloat(review.reviewRating),
                            reviewDate: review.reviewDate,
                            reviewerRole: review.reviewerRole,
                            reviewPros: review.reviewPros,
                            reviewCons: review.reviewCons
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
    const pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    })
    
    const indexName = 'company-reviews';
    const namespaceName = 'ns1';
    
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

    await upsertToPinecone(index);

    const lastMessage = data[data.length - 1]
    const text = lastMessage.content
    const criteria = lastMessage.criteria || {};

    console.log("criteria: ", criteria)
  
    const embedding = await inference.featureExtraction({
        model: "sentence-transformers/all-MiniLM-L6-v2",
        inputs: text,
    });

    let filter = {};
    if (criteria.company) {
        filter.company = criteria.company;
    }
    if (criteria.minRating) {
        filter.reviewRating = { $gte: criteria.minRating };
    }

    console.log("filter: ", filter)
    
    let queryParams = {
        topK: 5,
        vector: embedding,
        includeMetadata: true,
        includeValues: true,
    };

    // Only add the filter if it's not empty
    if (Object.keys(filter).length > 0) {
        queryParams.filter = filter;
    }
  
    const results = await index.query(queryParams)
  
    // let resultString = '\n\nReturned results from vector db (done automatically)'
    // results.matches.forEach((match) => {
    //     resultString += `\n
    //     Returned Results:
    //     Professor: ${match.id}
    //     Review: ${match.metadata.review}
    //     Subject: ${match.metadata.subject}
    //     Stars: ${match.metadata.stars}
    //     \n\n
    //     `
    // })

    let resultString = '';
    if (results.matches.length === 0) {
        resultString = 'No reviews match the given criteria.';
    } else {
        resultString = '\n\nRelevant reviews based on your criteria';
        results.matches.forEach((match, index) => {
            resultString += `\n
            ${index + 1}. Company: ${match.metadata.company}
            Review Title: ${match.metadata.reviewTitle}
            Rating: ${match.metadata.reviewRating} stars
            Date: ${match.metadata.reviewDate}
            Reviewer Role: ${match.metadata.reviewerRole}
            Pros: "${match.metadata.reviewPros}"
            Cons: "${match.metadata.reviewCons}"
            `;
        });
    }

    console.log(resultString)

    const lastMessageContent = lastMessage.content + resultString
    const lastDataWithoutLastMessage = data.slice(0, data.length - 1)
  
    const completion = await groq.chat.completions.create({
        messages: [
            {
            role: 'system', 
            content: systemPrompt
            },
            ...lastDataWithoutLastMessage,
    
            {
            role: 'user', 
            content: lastMessageContent},
        ],
        model: "llama3-8b-8192",
        stream: true,
        max_tokens: 500,
    })
  
  
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content
            if (content) {
              const text = encoder.encode(content)
              controller.enqueue(text)
            }
          }
        } catch (err) {
          controller.error(err)
        } finally {
          controller.close()
        }
      },
    })
    return new NextResponse(stream)
    
}
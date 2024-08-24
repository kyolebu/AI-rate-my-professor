import { NextResponse } from 'next/server'
import { Pinecone } from '@pinecone-database/pinecone'
import { HfInference } from '@huggingface/inference';
import Groq from "groq-sdk";
import fs from 'fs/promises';
import path from 'path';


const systemPrompt = `
You are a Rate My Professor assistant that helps students find classes and professors. You can provide personalized professor recommendations based on user input criteria.
For every user question, analyze their requirements and use the top 3 matching professors returned from the vector database to provide recommendations.
Consider factors such as subject area, teaching style, difficulty level, and student ratings when making recommendations.
Provide concise yet informative answers, and always base your recommendations on the data provided. Do not make up any information. Only look for the information in the data provided.
If a professor cannot be found with the given subject or rating, respond by saying a matching professor could not be found.
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
        const filePath = path.join(process.cwd(), 'reviews.json');
        const fileContents = await fs.readFile(filePath, 'utf8');
        const { reviews } = JSON.parse(fileContents);

        const batchSize = 100; // Pinecone recommends batches of 100 or fewer
        for (let i = 0; i < reviews.length; i += batchSize) {
            const batch = reviews.slice(i, i + batchSize);
            console.log('Batch:', batch);
            const vectors = await Promise.all(batch.map(async (review) => {
                console.log('Review text:', review.review);
                const embedding = await inference.featureExtraction({
                    model: "sentence-transformers/all-MiniLM-L6-v2",
                    inputs: [review.review],
                });
                return {
                    id: `${review.professor}_${review.subject}`,
                    values: Array.from(embedding),
                    metadata: {
                    professor: review.professor,
                    subject: review.subject,
                    stars: review.stars,
                    review: review.review
                    }
                };
            }));
            await index.upsert(vectors);
            console.log(`Upserted batch ${i / batchSize + 1}`);
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
    
    const indexName = 'rag';
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

    // if (data.action === 'upsert') {
    //     await upsertToPinecone(index);
    //     return new NextResponse(JSON.stringify({ message: 'Data upserted successfully' }), {
    //       status: 200,
    //       headers: { 'Content-Type': 'application/json' }
    //     });
    // }

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
    if (criteria.subject) {
        filter.subject = criteria.subject;
    }
    if (criteria.minRating) {
        filter.stars = { $gte: criteria.minRating };
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
        resultString = 'The criteria does not match any professor.';
    } else {
        resultString = '\n\nRecommended professors based on your criteria:';
        results.matches.forEach((match, index) => {
            resultString += `\n
            ${index + 1}. Professor: ${match.metadata.professor}
            Subject: ${match.metadata.subject}
            Rating: ${match.metadata.stars} stars
            Review: "${match.metadata.review}..."
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
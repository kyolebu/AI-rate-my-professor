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

// Write namespaces to a file
async function writeNamespaces(namespaces) {
    const filePath = path.join(process.cwd(), 'namespaces.json');
    await fs.writeFile(filePath, JSON.stringify(namespaces));
}

export async function POST(req) {
    const data = await req.json()
    
    const indexName = 'company-reviews';
    // const namespaceName = 'Google';
    
    const lastMessage = data[data.length - 1]
    console.log("lastMessage: ", lastMessage)
    const text = lastMessage.content
    console.log("text: ", text)
    const criteria = lastMessage.criteria || {};

    console.log("criteria: ", criteria)

    const index = pc.index(indexName);
    const statsResponse = await index.describeIndexStats();
    console.log('namespaces', JSON.stringify(statsResponse, null, 2)); // Log the full response for debugging
    const namespaces = Object.keys(statsResponse.namespaces);
    await writeNamespaces(namespaces);

    console.log('Namespaces: ', namespaces)
  
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
  
    // const results = await index.namespace(namespaceName).query(queryParams)
 

    // let resultString = '';
    // if (results.matches.length === 0) {
    //     resultString = 'No reviews match the given criteria.';
    // } else {
    //     resultString = '\n\nRelevant reviews based on your criteria';
    //     results.matches.forEach((match, index) => {
    //         resultString += `\n
    //         ${index + 1}. Company: ${match.metadata.company}
    //         Reviewer Role: ${match.metadata.reviewerRole}
    //         Rating: ${match.metadata.reviewRating} stars
    //         Review: ${match.metadata.reviewText}
    //         `;
    //     });
    // }

    // console.log(resultString)

    let aggregatedResults = [];

    // Iterate through all namespaces and run the query
    for (const namespace of namespaces) {
        const results = await index.namespace(namespace).query(queryParams);

        if (results.matches.length > 0) {
            aggregatedResults.push(...results.matches);
        }
    }

    let resultString = '';
    if (aggregatedResults.length === 0) {
        resultString = 'No reviews match the given criteria.';
    } else {
        resultString = '\n\nRelevant reviews based on your criteria:';
        aggregatedResults.forEach((match, index) => {
            resultString += `\n
            ${index + 1}. Company: ${match.metadata.company}
            Reviewer Role: ${match.metadata.reviewerRole}
            Rating: ${match.metadata.reviewRating} stars
            Review: ${match.metadata.reviewText}
            `;
        });
    }

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
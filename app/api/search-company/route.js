// pages/api/search-company.js

import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

// Convert exec to return a promise
const execPromise = promisify(exec)

// Handler for POST requests
export async function POST(request) {
  try {
    console.log('Received POST request')

    // Parse JSON data from the request
    const { companyName } = await request.json()

    console.log('Company name received:', companyName)

    // Check if the companyName is provided
    if (!companyName) {
      console.error('Company name is missing')
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 })
    }

    // Define the full path to the Python script
    const pythonScriptPath = process.env.SCRAPER_PATH

    console.log("Running Scraper...")

    // Run the Python script with the companyName as an argument
    const { stdout, stderr } = await execPromise(`python "${pythonScriptPath}" ${companyName}`)

    if (stderr) {
      console.error('Python script error:', stderr)
      return NextResponse.json({ error: 'Error running the Python script' }, { status: 500 })
    }

    console.log('Python script output:', stdout)

    // Return the response from the script
    return NextResponse.json({ message: `Data for ${companyName} has been processed` })
  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

// Export other HTTP methods if needed
export async function GET(request) {
  return NextResponse.json({ message: 'GET method is not implemented' })
}

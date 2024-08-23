// pages/centeredPage.js

import { Button } from "@/components/ui/button"
import Image from 'next/image';
import Link from 'next/link';

export default function landingPage() {
  return (
    <div style={styles.container}>
      <Image
        src="/img/fireside_logo.png" // Replace with your image path
        alt="Logo"
        width={300} // Set your desired width
        height={300} // Set your desired height
        style={styles.image}
      />
      <div style={styles.textBox}>
        <p style={styles.description}>
            FiresideAI's rate my professor app with AI integration, built with OpenAI, Llama 3.1, Pinecone, Next.js, Shadcn UI, RAG, and more.
        </p>
      </div>
      <Button>
        <Link href="/chatbot">Open</Link>
      </Button>
    </div>
  );
}

// Inline styles for simplicity, you can use CSS or a CSS-in-JS solution instead
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '90vh',
    textAlign: 'center',
  },
  image: {
    marginBottom: '20px',
  },
  textBox: {
    width: '60%', // Adjust this width as needed
    maxWidth: '800px', // Set a maximum width for the text box
    padding: '20px', // Add padding inside the text box
    backgroundColor: '#f9f9f9', // Optional: Add a background color
    borderRadius: '8px', // Optional: Add rounded corners
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)', // Optional: Add a subtle shadow
    marginBottom: '20px',
  },
  description: {
    fontSize: '18px',
    marginBottom: '20px',
  },
  button: {
    padding: '10px 20px',
    fontSize: '16px',
    cursor: 'pointer',
  },
};
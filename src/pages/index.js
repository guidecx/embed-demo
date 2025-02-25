import Head from "next/head";
import styles from "@/styles/Home.module.css";
import { useEffect, useState } from "react";

export default function Home() {
  const customerEmail = process.env.NEXT_PUBLIC_CUSTOMER_EMAIL
  
  const [iframeUrl, setIframeUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [embedToken, setEmbedToken] = useState('')
  const [projectId, setProjectId] = useState('')
  
  const getEmbedToken = async () => {
    setLoading(true)
    try {
      const request = await fetch('/api/embed-token', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const result = await request.json()
      
      setEmbedToken(result.embedToken)
      setProjectId(result.projectId)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const generateIframeUrl = () => { 
    const url = new URL(`/auth/customer-login/sso`, 'https://app.guidecx.com/')

    url.searchParams.append('token', embedToken)
    url.searchParams.append('projectId', projectId)
    url.searchParams.append('email', customerEmail)

    return url.toString()
  }

  useEffect(() => {
    const url = generateIframeUrl();
  
    setIframeUrl(url);
  }, [embedToken])

  useEffect(() => {
   getEmbedToken() 
  }, [])

  return (
    <>
      <Head>
        <title>Customer Portal</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap" rel="stylesheet" />
      </Head>
      <main className={`${styles.main}`}>
        <h1 className={`${styles.title}`}>Embedded Portal Demo</h1>
      {iframeUrl && !loading ? (
          <iframe className={`${styles.embed}`} src={iframeUrl}/>
        ) : null
        }
      </main>
    </>
  );
}

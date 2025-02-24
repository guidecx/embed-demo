// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export default async function handler(req, res) {
  const gcxOpenApiToken = process.env.API_TOKEN
  const gcxApiUrl = process.env.EMBED_API
  const customerEmail = process.env.NEXT_PUBLIC_CUSTOMER_EMAIL

  try {
    const request = await fetch(gcxApiUrl, {
      method: 'POST',
      body: JSON.stringify({
        customerUserEmail: customerEmail
      }),
      headers: {
        Authorization: `Bearer ${gcxOpenApiToken}`,
        'Content-Type': 'application/json'
      }
    })
    
    const result = await request.json()

    return res.status(200).json({
      embedToken: result.embedToken,
      projectId: result.projects[0].id,
    })
  } catch (e) {
  console.log('error')
  console.error(e)
    res.status(500).json({error: "Internal error"})
  }
}

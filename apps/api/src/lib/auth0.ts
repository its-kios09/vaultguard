import { ManagementClient, AuthenticationClient } from 'auth0'

const domain = process.env.AUTH0_DOMAIN!
const audience = process.env.AUTH0_AUDIENCE!

export const getM2MToken = async (clientId: string, clientSecret: string): Promise<string> => {
  const authClient = new AuthenticationClient({ domain, clientId, clientSecret })
  const response = await authClient.oauth.clientCredentialsGrant({ audience })
  return response.data.access_token
}

export const getMediCoreToken = async (): Promise<string> => {
  return getM2MToken(
    process.env.MEDICORE_CLIENT_ID!,
    process.env.MEDICORE_CLIENT_SECRET!
  )
}

export const getNatSupplyToken = async (): Promise<string> => {
  return getM2MToken(
    process.env.NATSUPPLY_CLIENT_ID!,
    process.env.NATSUPPLY_CLIENT_SECRET!
  )
}

export const getAgentToken = async (clientId: string, clientSecret: string): Promise<string> => {
  return getM2MToken(clientId, clientSecret)
}

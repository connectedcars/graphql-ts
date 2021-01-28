import JwtUtils from '@connectedcars/jwtutils'
import axios from 'axios'

export interface ServiceAccountInfo {
  iss: string
  aud: string
  kid: string
  rsa: string
}

export interface JwtHeader {
  typ: 'JWT'
  alg: string
  kid: string
}

export function _readServiceAccountData(ccServiceAccountKeyData: string): ServiceAccountInfo {
  const [ccInfo, rsa] = ccServiceAccountKeyData.split('----- END CONNECTEDCARS INFO -----\n')

  const ccRegex = /----- BEGIN CONNECTEDCARS INFO -----\niss: (.*)\naud: (.*)\nkid: (.*)\n/
  const match = ccInfo.match(ccRegex)
  if (!match) {
    throw new Error('Malformed service account file')
  }
  const iss = match[1]
  const aud = match[2]
  const kid = match[3]

  return {
    iss,
    aud,
    kid,
    rsa
  }
}

export interface CCToken {
  token: string
  expires: number
}

export async function _getToken(
  parsedServiceAccountInfo: ServiceAccountInfo,
  authApiEndpoint: string,
  organizationNamespace: string
): Promise<CCToken> {
  const unixNow = Math.floor(Date.now() / 1000)

  const jwtHeader = {
    typ: 'JWT',
    alg: 'RS256',
    kid: parsedServiceAccountInfo.kid
  }

  const jwtBody = {
    aud: parsedServiceAccountInfo.aud,
    iss: parsedServiceAccountInfo.iss,
    iat: unixNow,
    exp: unixNow + 3600
  }

  const jwt = JwtUtils.JwtUtils.encode(parsedServiceAccountInfo.rsa, jwtHeader, jwtBody)

  const res = await axios.post(
    authApiEndpoint,
    {
      token: jwt
    },
    {
      headers: { 'x-organization-namespace': organizationNamespace }
    }
  )
  if (!res.data.token || !res.data.expires) {
    throw new Error('No token returned')
  }

  const expires = Date.now() + res.data.expires * 1000

  return { token: res.data.token, expires }
}

export class CCGraphQl {
  public _API_ENDPOINT: string
  public _AUTH_API_ENDPOINT: string
  public _ORGANIZATION_NAMESPACE: string
  public _ccAccessToken: CCToken | undefined
  public _parsedServiceAccountInfo: ServiceAccountInfo

  /**
   * Create an instance of the Connected Cars api, which can be used to call the GraphQL api. Requires specifying service account key data and endpoints
   * @param {string} ccServiceAccountKeyData a string containing the Connected Cars service account data
   * @param {string} [endpoint] specify the connected cars api endpoint, default is production endpoint
   * @param {string} [authEndpoint] specify the connected cars auth endpoint, default is production endpoint
   * @param {string} [organizationNamespace] specify the organization namespace, ask Connected Cars for more info
   * @throws an error if the service account data is malformed
   */
  public constructor(
    ccServiceAccountKeyData: string,
    endpoint = 'https://api.connectedcars.io/graphql',
    authEndpoint = 'https://auth-api.connectedcars.io/auth/login/serviceAccountConverter',
    organizationNamespace = 'semler:workshop'
  ) {
    this._API_ENDPOINT = endpoint
    this._AUTH_API_ENDPOINT = authEndpoint
    this._ORGANIZATION_NAMESPACE = organizationNamespace
    this._ccAccessToken = undefined
    this._parsedServiceAccountInfo = _readServiceAccountData(ccServiceAccountKeyData)
  }

  /**
   * Gets a Connected Cars access token, if you want to interact with the api without using the call() method
   * @returns {Promise<string>}
   * @throws an error if the CC auth api cannot validate your credentials
   */
  public async getAccessToken(): Promise<string> {
    const now = Date.now()
    // If no token or the token would expire within 5 minutes refresh
    if (!this._ccAccessToken || this._ccAccessToken.expires < now + 5 * 60 * 1000) {
      this._ccAccessToken = await _getToken(
        this._parsedServiceAccountInfo,
        this._AUTH_API_ENDPOINT,
        this._ORGANIZATION_NAMESPACE
      )
    }
    return this._ccAccessToken.token
  }

  /**
   * Clears the Connected Cars token, which will force a refetch next time call() is used.
   * This is done automatically in case the token is invalid on a call()
   */
  public _clearToken(): void {
    this._ccAccessToken = undefined
  }

  /**
   * Call the Connected Cars GraphQL api
   * @param {Object} graphQLInput Should be valid graphql input, such as `query User {user(id:52163) {id firstname} }`
   * @returns {Promise<Object>} returns a graphql response such as user: {id: "52163", firstname: null}
   * @throws an error if the call to the CC api fails, or if the CC auth api cannot validate your credentials
   */
  public async call(graphQLInput: string): Promise<unknown> {
    const bearerToken = await this.getAccessToken()

    const config = {
      headers: {
        Authorization: 'Bearer ' + bearerToken,
        'x-organization-namespace': this._ORGANIZATION_NAMESPACE
      }
    }
    const query = {
      query: graphQLInput
    }

    try {
      const result = await axios.post(this._API_ENDPOINT, query, config)
      return result.data.data
    } catch (err) {
      // Retry once with a new token in case of 401
      if (err.response && err.response.status === 401) {
        await this._clearToken()
        const newBearerToken = await this.getAccessToken()
        const newConfig = {
          headers: {
            Authorization: 'Bearer ' + newBearerToken,
            'x-organization-namespace': this._ORGANIZATION_NAMESPACE
          }
        }
        const result = await axios.post(this._API_ENDPOINT, query, newConfig)
        return result.data.data
      }
      throw err
    }
  }
}

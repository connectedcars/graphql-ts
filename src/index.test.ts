import * as fs from 'fs'

import { clearCCApiInstance, getCCApi, isEnvironment } from './'

const fakeServiceAccount = `----- BEGIN CONNECTEDCARS INFO -----
iss: testing@cc.serviceaccount.connectedcars.io
aud: https://auth-api.staging.connectedcars.io/auth/login/serviceAccountConverter
kid: 999
----- END CONNECTEDCARS INFO -----
-----BEGIN RSA PRIVATE KEY-----
could_totally_be_a_real_key
-----END RSA PRIVATE KEY-----`

describe('index', () => {
  const secretPath = `/tmp/superSecret85.txt`

  beforeEach(() => {
    fs.writeFileSync(secretPath, fakeServiceAccount)
  })

  afterEach(() => {
    clearCCApiInstance()
  })

  it('isEnvironment', () => {
    expect(isEnvironment('testing')).toEqual(true)
    expect(isEnvironment('production')).toEqual(true)
    expect(isEnvironment('testing')).toEqual(true)
    expect(isEnvironment('bingokarl')).toEqual(false)
  })

  it('uses the singleton two times, staging', () => {
    const result1 = getCCApi({ secretPath, environment: 'staging' })
    const result2 = getCCApi({ secretPath, environment: 'staging' })
    expect(result1).toStrictEqual(result2)
  })

  it('uses the singleton two times, production', () => {
    const result1 = getCCApi({ secretPath, environment: 'production' })
    const result2 = getCCApi({ secretPath, environment: 'production' })
    expect(result1).toStrictEqual(result2)
  })

  it('Error, environment is not set to a supported value', () => {
    expect(() => {
      getCCApi({ secretPath, environment: 'bingo' })
    }).toThrow(new Error(`Cannot get CCApi singleton when ENVIRONMENT is defaulted or set to testing`))
  })
})

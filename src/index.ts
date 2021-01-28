import * as fs from 'fs'

import { CCGraphQl } from './cc-graphql'
export * from './cc-graphql'

export type Environment = 'testing' | 'staging' | 'production'
export function isEnvironment(x: string): x is Environment {
  return new RegExp(/testing|staging|production/).test(x)
}

// Singleton functionality
let CCApi: CCGraphQl | undefined = undefined

export function clearCCApiInstance(): void {
  CCApi = undefined
}

export function getCCApi(overrides: { secretPath?: string; environment?: string } = {}): CCGraphQl {
  if (CCApi) {
    return CCApi
  }
  const ORGANIZATION_NAMESPACE = process.env.ORGANIZATION_NAMESPACE

  const environment = overrides.environment || process.env.ENVIRONMENT
  if (environment === 'production') {
    const secretPath = overrides.secretPath || `/root/secrets/graphql/production.txt`
    const readConfig = fs.readFileSync(secretPath, 'utf-8')
    CCApi = new CCGraphQl(
      readConfig,
      'https://api.connectedcars.io/graphql',
      'https://auth-api.connectedcars.io/auth/login/serviceAccountConverter',
      ORGANIZATION_NAMESPACE
    )
    return CCApi
  } else if (environment === 'staging') {
    const secretPath = overrides.secretPath || `/root/secrets/graphql/staging.txt`
    const readConfig = fs.readFileSync(secretPath, 'utf-8')
    CCApi = new CCGraphQl(
      readConfig,
      'https://api.staging.connectedcars.io/graphql',
      'https://auth-api.staging.connectedcars.io/auth/login/serviceAccountConverter',
      ORGANIZATION_NAMESPACE
    )
    return CCApi
  } else {
    throw new Error(`Cannot get CCApi singleton when ENVIRONMENT is defaulted or set to testing`)
  }
}

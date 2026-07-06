import {createClient} from '@sanity/client'

/**
 * Build-time only Sanity client.
 *
 * IMPORTANT: This module must only be imported from Astro frontmatter
 * (build/server-time code), never from client-side scripts or hydrated
 * islands. `SANITY_API_READ_TOKEN` must never reach the browser — there is
 * no runtime compute on OVH's static hosting, so nothing here should ever
 * be bundled into shipped JS.
 */

const projectId = process.env.SANITY_PROJECT_ID
const dataset = process.env.SANITY_DATASET
const token = process.env.SANITY_API_READ_TOKEN

if (!projectId || !dataset) {
  throw new Error(
    'Missing SANITY_PROJECT_ID or SANITY_DATASET env vars. Copy .env.example to .env and fill in real values.',
  )
}

export const sanityClient = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2024-01-01',
  useCdn: !token, // authenticated reads bypass the CDN cache per @sanity/client guidance
})

/** A string with both French and English values (D-09 locale-object shape). */
export interface LocaleString {
  fr: string
  en: string
}

/** The published `siteSettings` singleton, typed for both locales. */
export interface SiteSettings {
  siteTitle: LocaleString
  navLabels: {
    home: LocaleString
  }
  footerText: LocaleString
  welcomeHeading: LocaleString
  welcomeBody: LocaleString
}

const SITE_SETTINGS_QUERY = /* groq */ `*[_type == "siteSettings"][0]{
  siteTitle,
  navLabels,
  footerText,
  welcomeHeading,
  welcomeBody
}`

/**
 * Fetches the published `siteSettings` singleton at build time.
 * Returns `null` if the document has not been published yet.
 */
export async function getSiteSettings(): Promise<SiteSettings | null> {
  const result = await sanityClient.fetch<SiteSettings | null>(SITE_SETTINGS_QUERY)
  return result ?? null
}

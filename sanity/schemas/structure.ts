import type {StructureResolver} from 'sanity/structure'

/**
 * Custom desk structure: pins `siteSettings` to a single, fixed document ID
 * ("siteSettings") and removes it from the generic document-type list, so
 * editors always land on the one true singleton instance rather than being
 * able to create additional siteSettings documents.
 */
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Site Settings')
        .id('siteSettings')
        .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
      ...S.documentTypeListItems().filter((listItem) => listItem.getId() !== 'siteSettings'),
    ])

import {defineField, defineType} from 'sanity'

/**
 * Reusable image + bilingual-alt object type, embedded inline in `gallery`'s
 * `images` array (D-01/D-02). Both `fr`/`en` alt sub-fields are required so
 * Romane cannot publish an image without accessible alt text in either
 * language — same locale-object shape as `siteSettings.ts`'s
 * `localeStringField` helper, inlined here since no shared schema-lib module
 * exists yet (see 02-PATTERNS.md).
 */
export const galleryImage = defineType({
  name: 'galleryImage',
  title: 'Gallery Image',
  type: 'object',
  fields: [
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'alt',
      title: 'Alt Text',
      type: 'object',
      validation: (rule) => rule.required(),
      fields: [
        defineField({name: 'fr', title: 'French', type: 'string', validation: (rule) => rule.required()}),
        defineField({name: 'en', title: 'English', type: 'string', validation: (rule) => rule.required()}),
      ],
    }),
  ],
  preview: {
    select: {media: 'image', title: 'alt.fr'},
  },
})

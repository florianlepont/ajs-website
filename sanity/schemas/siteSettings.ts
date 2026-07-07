import {defineField, defineType} from 'sanity'

/**
 * Locale-aware string pair: a single field carrying both FR and EN values.
 * Reused for every chrome/copy field this singleton exposes (D-09).
 */
function localeStringField(name: string, title: string) {
  return defineField({
    name,
    title,
    type: 'object',
    fields: [
      defineField({name: 'fr', title: 'French', type: 'string', validation: (rule) => rule.required()}),
      defineField({name: 'en', title: 'English', type: 'string', validation: (rule) => rule.required()}),
    ],
  })
}

function localeTextField(name: string, title: string) {
  return defineField({
    name,
    title,
    type: 'object',
    fields: [
      defineField({name: 'fr', title: 'French', type: 'text', rows: 3, validation: (rule) => rule.required()}),
      defineField({name: 'en', title: 'English', type: 'text', rows: 3, validation: (rule) => rule.required()}),
    ],
  })
}

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  // Singleton: only one instance should ever exist. Enforced via the Studio
  // structure builder (sanity/schemas/structure.ts), which pins this type to a
  // single fixed document ID and removes it from the generic document list.
  fields: [
    localeStringField('siteTitle', 'Site Title'),
    defineField({
      name: 'navLabels',
      title: 'Navigation Labels',
      type: 'object',
      fields: [
        defineField({
          name: 'home',
          title: 'Home label',
          type: 'object',
          fields: [
            defineField({name: 'fr', title: 'French', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'en', title: 'English', type: 'string', validation: (rule) => rule.required()}),
          ],
        }),
        defineField({
          name: 'galleries',
          title: 'Galleries label',
          type: 'object',
          fields: [
            defineField({name: 'fr', title: 'French', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'en', title: 'English', type: 'string', validation: (rule) => rule.required()}),
          ],
        }),
      ],
    }),
    localeStringField('footerText', 'Footer Text'),
    localeStringField('welcomeHeading', 'Homepage Welcome Heading'),
    localeTextField('welcomeBody', 'Homepage Welcome Body'),
  ],
  preview: {
    select: {title: 'siteTitle.fr'},
    prepare({title}) {
      return {title: title || 'Site Settings'}
    },
  },
})

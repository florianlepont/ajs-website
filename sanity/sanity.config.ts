import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemas'
import {structure} from './schemas/structure'

export default defineConfig({
  name: 'default',
  title: 'Atelier Jacqueline Suzanne',

  projectId: 'gwz8iug4',
  dataset: 'production',

  plugins: [structureTool({structure}), visionTool()],

  schema: {
    types: schemaTypes,
  },
})

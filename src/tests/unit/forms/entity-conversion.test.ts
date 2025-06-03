import { noteToFormData, formDataToNote, conceptToFormData, formDataToConcept, promptToFormData, formDataToPrompt } from '@/components/forms/entity-types'

describe('entity type conversions', () => {
  test('note to form data and back', () => {
    const note: any = {
      id: '1',
      name: 'n',
      emoji: '📝',
      color: '#000',
      description: null,
      title: 't',
      content: 'c',
      category: 'general',
      priority: 1,
      status: 'active',
      tags: '["a","b"]',
      featuredImage: null,
      isFavorite: true,
    }
    const formData = noteToFormData(note)
    expect(formData.tags).toEqual(['a', 'b'])
    const back = formDataToNote(formData)
    expect(back.tags).toBe('["a","b"]')
  })

  test('concept to form data and back', () => {
    const concept: any = {
      id: 'c1',
      name: 'concept',
      emoji: '💡',
      color: '#000',
      description: null,
      content: 'test',
      category: 'general',
      tags: '["x"]',
      featuredImage: null,
      isFavorite: false,
    }
    const formData = conceptToFormData(concept)
    expect(formData.tags).toEqual(['x'])
    const back = formDataToConcept(formData)
    expect(back.tags).toBe('["x"]')
  })

  test('prompt to form data and back', () => {
    const prompt: any = {
      id: 'p1',
      name: 'prompt',
      emoji: '🎯',
      color: '#000',
      description: null,
      content: 'test',
      category: 'general',
      parameters: '{}',
      tags: '["y"]',
      featuredImage: null,
      isFavorite: false,
    }
    const formData = promptToFormData(prompt)
    expect(formData.tags).toEqual(['y'])
    const back = formDataToPrompt(formData)
    expect(back.tags).toBe('["y"]')
  })
})

import { useLdJsonUtils } from 'src/core/services/LdJsonUtils'
import { describe, expect, it } from 'vitest'

describe('LdJsonUtils', () => {
  it('should find recipe type', () => {
    const data = {
      '@context': 'https://schema.org/',
      '@type': 'Recipe',
      '@id': 'https://eat.de/rezept/pfundstopf-landfrauen-rezept/#rezept',
    }
    const result = useLdJsonUtils().typeIs(data, 'Recipe')
    expect(result).toBeTruthy()
  })

  it('should find image in string array', () => {
    const data = {
      image: ['https://test.de/img-9250.jpg', 'https://test.de/img-9250-1200x675.jpg'],
    }
    const result = useLdJsonUtils().extractImage(data)
    expect(result).toBe('https://test.de/img-9250.jpg')
  })

  it('should find image in ImageObject', () => {
    const data = {
      image: {
        '@type': 'ImageObject',
        inLanguage: 'de-DE',
        url: 'https://test.de/autor_louis.jpg',
        caption: 'Louis',
      },
    }
    const result = useLdJsonUtils().extractImage(data)
    expect(result).toBe('https://test.de/autor_louis.jpg')
  })
})

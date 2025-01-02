import { createHash } from 'crypto'
import { createReadStream } from 'fs'

export async function computeHash(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256')
    const stream = createReadStream(filePath)

    stream.on('error', error => {
      reject(error)
    })

    stream.on('data', chunk => {
      hash.update(chunk)
    })

    stream.on('end', () => {
      resolve(hash.digest('hex'))
    })
  })
}
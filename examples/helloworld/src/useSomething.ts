import { useState } from 'react'

export function useSomething() {
  const [foo] = useState('something')
  return { value: foo }
}

export default useSomething

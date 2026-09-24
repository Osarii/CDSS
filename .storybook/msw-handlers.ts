import { http, HttpResponse } from 'msw'

export const mswHandlers = [
  http.get('http://localhost:3001/patients', () => {
    return HttpResponse.json([
      {
        id: 'p-synthetic-001',
        syntheticIdentifier: 'SYN-001',
        age: 68,
        gender: 'female',
      },
    ])
  }),
  http.get('http://localhost:3001/medications', () => {
    return HttpResponse.json([
      {
        id: 'm-synthetic-001',
        code: 'MED-01',
        name: 'Metformina 850mg',
        dosage: '850mg',
        route: 'oral',
      },
    ])
  }),
]

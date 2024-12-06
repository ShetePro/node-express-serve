export function getRequestBody (req) {
  if (!req.body) return req.sendStatus(400)
  return req.body
}


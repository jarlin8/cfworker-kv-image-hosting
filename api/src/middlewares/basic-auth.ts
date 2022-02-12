import type { Middleware } from '@cfworker/web'

const verifyBasicAuth = (auth: string) => {
	const [scheme, encoded] = auth.split(' ')

	if (!encoded || scheme !== 'Basic') {
		return false
	}

	const buffer = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0))
	const decoded = new TextDecoder().decode(buffer).normalize()

	const colonIndex = decoded.indexOf(':')
	if (colonIndex === -1 || /[\0-\x1F\x7F]/.test(decoded)) {
		return false
	}

	const decodedUsername = decoded.substring(0, colonIndex)
	const decodedPassword = decoded.substring(colonIndex + 1)
	if (decodedUsername === USERNAME && decodedPassword === PASSWORD) {
		return true
	}

	return false
}

const basicAuth: Middleware = async ({ req, res }, next) => {
	if (/^\/img\/.+$/.test(req.url.pathname) && req.method === 'GET') {
		await next()
		return
	}

	if (ENV === 'dev') {
		await next()
		return
	}

	if (req.url.protocol !== 'https:') {
		res.status = 400
		return
	}

	const auth = req.headers.get('Authorization')
	if (!auth || !verifyBasicAuth(auth)) {
		res.status = 401
		res.headers.set('WWW-Authenticate', 'Basic charset="UTF-8"')
		return
	}

	await next()
}

export default basicAuth

class Resource404error extends Error {
	constructor(host, path) {
		super();
		this.name = 'resource404';
		this.message = `Страница с адресом ${host}/${path} не найдена`;
		this.host = host;
		this.path = path;
	}
}

module.exports = Resource404error;
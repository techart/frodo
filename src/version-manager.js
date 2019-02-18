class VersionManager {
	constructor() {
		this.targetVersion = 'master';
		this._tags = null; //Список текгов с сервера
	}

	set tags(data) {
		this._tags = JSON.parse(data.toString());
	}

	sameMajor(targetTag) {//(targetTag = текущая версия) Сопоставление текущего мажора и мажора на который запрос обновления
		if (this.targetVersion == 'master') { //Если мастер, то ориентируемся на последний мажор
			return this.getLatest('Major') == targetTag.split('.')[0];
		}
		return this.targetVersion.split('.')[0] == targetTag.split('.')[0];
	}

	tagExist() { //Проверка наличия требуемой версии
		if (this.targetVersion == 'master') {
			return true;
		}

		this.targetVersion = this._getTargetVersion(); //Откорректировать номер версии
		return this._searchInTags() !== undefined; //Проверка реального наличия тега
	}

	getLatest(partName, tags) { //Получение максимального тега в пределах partName
		tags = tags || this._tags;
		return tags.reduce((prev, curr) => {
			let curPart = this[`_get${partName}`](curr);
			if (prev < curPart) {
				prev = curPart;
			}
			return prev;
		}, 0);
	}

	_getTargetVersion() { //вычисление максимально допустимого тега версии из указнной пользователем версии
		let [major, minor, patch] = this.targetVersion.split('.');
		if (minor !== undefined && patch !== undefined) { //Если не semver оставить как есть
			return this.targetVersion;
		}
		let tags = this._tags;

		tags = tags.filter((tag) => { //Оставляем только нужные мажоры
			return this._getMajor(tag) == major;
		});

		minor = minor || this.getLatest('Minor', tags); //Используем либо явно указнный минор, либо последний доступный.

		tags = tags.filter((tag) => { //Оставляем только нужные миноры
			return this._getMinor(tag) == minor;
		});

		patch = patch || this.getLatest('Patch', tags); //Используем либо явно указнный патч, либо последний доступный.

		return [major, minor, patch].join('.');
	}

	_getMajor(tag) {
		return tag.name.split('.')[0];
	}

	_getMinor(tag) {
		return tag.name.split('.')[1];
	}

	_getPatch(tag) {
		return tag.name.split('.')[2];
	}

	_searchInTags() { //Проверка реального наличия тега по номеру версии this.targetVersion
		return this._tags.find((el) => {
			return el.name == this.targetVersion;
		});
	}
}

export default VersionManager;
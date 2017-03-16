class VersionManager
{
	constructor() {
		this.targetVersion = 'master';
		this._tags = null;
	}

	set tags(data) {
		this._tags = JSON.parse(data.toString());
	}

	sameMajor(targetTag) {
		if (this.targetVersion == 'master') {
			return this.getLatest('Major') == targetTag.split('.')[0];
		}
		return this.targetVersion.split('.')[0] == targetTag.split('.')[0];
	}

	tagExist() {
		if (this.targetVersion == 'master') {
			return true;
		}

		this.targetVersion = this._getTargetVersion();
		return this._searchInTags() !== undefined;
	}

	getLatest(partName, tags) {
		tags = tags || this._tags;
		return tags.reduce((prev, curr) => {
			let curPart = this[`_get${partName}`](curr);
			if (prev < curPart) {
				prev = curPart;
			}
			return prev;
		}, 0);
	}

	_getTargetVersion() {
		let [major, minor, patch] = this.targetVersion.split('.');
		if (minor !== undefined && patch !== undefined) {
			return this.targetVersion;
		}
		let tags = this._tags;

		tags = tags.filter((tag) => {
			return this._getMajor(tag) == major;
		});

		minor = minor || this.getLatest('Minor', tags);

		tags = tags.filter((tag) => {
			return this._getMinor(tag) == minor;
		});

		patch = patch || this.getLatest('Patch', tags);

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

	_searchInTags() {
		return this._tags.find((el) => {
			return el.name == this.targetVersion;
		})
	}
}

export default VersionManager
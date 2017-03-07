export default class ExitError extends Error
{
	constructor(message, errorCode) {
		super(message);
		this.errorCode = errorCode;
	}
}
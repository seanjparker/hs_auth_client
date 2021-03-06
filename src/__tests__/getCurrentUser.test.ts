process.env.AUTH_URL = '';

import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import * as authClient from '../';
import { users as fixtures } from './fixtures/users';
import { transformExtendedUser } from '../util/transformUser';

const mock = new MockAdapter(axios);

afterEach(() => {
	mock.reset();
});

test('getCurrentUser(): fetches and transforms users correctly', async () => {
	for (const user of fixtures) {
		mock.onGet('/api/v1/users/me').reply(200, {
			status: 200,
			error: '',
			user
		});

		const response = await authClient.getCurrentUser('token', 'url');
		expect(response).toEqual(transformExtendedUser(user));
	}
});

test(`getCurrentUser(): throws when API response has error code`, async () => {
	const errorCodes = [400, 500];

	for (const errorCode of errorCodes) {
		mock.onGet('/api/v1/users/me').reply(errorCode, {
			status: errorCode,
			error: 'Bad request'
		});
		await expect(authClient.getCurrentUser('token', 'url')).rejects.toThrow();
	}
});

// Ensures that requests are received with the referer header correctly set
describe('getCurrentUser() referrer', () => {
	const user = fixtures[0];
	const successfulResponse = {
		status: 200,
		error: '',
		user
	};

	test('unset referrer resolves', async () => {
		mock.onGet('/api/v1/users/me', {}, expect.objectContaining({
			Referer: expect.stringMatching('')
		})).reply(200, successfulResponse);

		expect(await authClient.getCurrentUser('token')).toEqual(transformExtendedUser(user));
	});

	test('custom string referrer', async () => {
		for (const referrer of ['http://unicsmcr.com/', 'https://google.com', 'test123', '']) {
			mock.reset();
			mock.onGet('/api/v1/users/me', {}, expect.objectContaining({
				Referer: expect.stringMatching(referrer)
			})).reply(200, successfulResponse);

			expect(await authClient.getCurrentUser('token', referrer)).toEqual(transformExtendedUser(user));
		}
	});
});
